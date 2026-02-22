"""
GreenSim Flask Backend
======================
Endpoints:
  POST /send_data/<species>          - ESP32 posts sensor readings + triggers push alerts
  GET  /get_data/<species>/<id>      - Frontend polls sensor data
  POST /auth/register                - Register with name, ntfy_topic, password
  POST /auth/login                   - Login, returns JWT token
  GET  /auth/me                      - Returns current user info (JWT required)
  POST /auth/toggle_alerts           - Enable/disable alerts (JWT required)

Push Notifications: ntfy.sh  (https://ntfy.sh) — 100% FREE, no API key needed.
  Users pick a secret topic name (e.g. "greensim-davis-9x7k") during registration.
  They subscribe to that topic in the free ntfy Android/iOS app.
  The backend POSTs to https://ntfy.sh/<topic> when a critical condition is detected.
"""

import os
import json
import hashlib
import secrets
import time
from datetime import datetime, timezone, timedelta
from functools import wraps

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY       = os.getenv("JWT_SECRET", "greensim-secret-change-in-prod")
NTFY_BASE_URL    = "https://ntfy.sh"   # free public instance

# Vercel serverless only allows writing to /tmp
USERS_FILE       = "/tmp/users.json"

# Alert cooldown: don't re-notify the same plant+condition within N seconds
ALERT_COOLDOWN_SEC = 600  # 10 minutes

# ── In-memory stores ─────────────────────────────────────────────────────────
# { "tomato:DROUGHT": <unix_timestamp_of_last_alert> }
_alert_cooldown: dict = {}

# Latest sensor data per species/sensor_id
# { "tomato:1": { "universal": {...}, "plant": {...}, "timestamp": "..." } }
_sensor_data: dict = {}

# ── Helpers: Persistence ─────────────────────────────────────────────────────

def _load_users() -> dict:
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_users(users: dict):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

# ── Helpers: Auth ────────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _create_token(phone: str) -> str:
    """Simple signed token: base64(payload).signature — no external lib needed."""
    import base64
    import hmac
    payload = json.dumps({"phone": phone, "exp": time.time() + 86400 * 30})  # 30 days
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"

def _verify_token(token: str):
    """Returns phone if valid, None otherwise."""
    import base64
    import hmac
    try:
        payload_b64, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload.get("phone")
    except Exception:
        return None

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        phone = _verify_token(token)
        if not phone:
            return jsonify({"error": "Unauthorized"}), 401
        users = _load_users()
        user = users.get(phone)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

# ── Helpers: Plant Health Engine (Python port) ───────────────────────────────

def evaluate_plant_health(t, rh, sm, st) -> dict:
    """
    Priority-ordered rule classifier matching PlantHealthEngine.js.
    Returns { id, label, emoji }
    """
    if t <= 1 or st <= 1:
        return {"id": "FROST",          "label": "Frost / Freeze",     "emoji": "🥶"}
    if st >= 35:
        return {"id": "ROOT_HEAT_STRESS","label": "Root Heat Stress",   "emoji": "🌡️"}
    if t >= 35:
        return {"id": "HEAT_STRESS",    "label": "Heat Stress",         "emoji": "🔥"}
    if sm < 30:
        return {"id": "DROUGHT",        "label": "Drought",             "emoji": "🏜️"}
    if sm > 85:
        return {"id": "WATERLOGGING",   "label": "Waterlogging",        "emoji": "💧"}
    if rh > 85:
        return {"id": "HIGH_HUMIDITY",  "label": "High Humidity Risk",  "emoji": "🍄"}
    if t >= 30 and t < 35 and rh < 40:
        return {"id": "FLOWER_DROP",    "label": "Flower Drop Risk",    "emoji": "🌸"}
    if t < 12 and t > 1:
        return {"id": "COLD_STRESS",    "label": "Cold Stress",         "emoji": "🧊"}
    if st < 15 and st > 1:
        return {"id": "ROOT_COLD_STRESS","label": "Root Cold Stress",   "emoji": "❄️"}
    return {"id": "NORMAL",             "label": "Normal / Optimal",    "emoji": "✅"}

# Critical conditions that always warrant an SMS
CRITICAL_CONDITIONS = {"FROST", "HEAT_STRESS", "ROOT_HEAT_STRESS", "DROUGHT"}
WARNING_CONDITIONS  = {"WATERLOGGING", "HIGH_HUMIDITY", "COLD_STRESS",
                       "ROOT_COLD_STRESS", "FLOWER_DROP"}

CONDITION_TIPS = {
    "FROST":           "Activate heaters IMMEDIATELY and cover all plants to prevent permanent damage.",
    "HEAT_STRESS":     "Increase ventilation and deploy shade cloths. Mist plants to lower leaf temperature.",
    "ROOT_HEAT_STRESS":"Cool soil with water or shade. Apply mulch to base to regulate temperature.",
    "DROUGHT":         "Water immediately. Check irrigation system for blockages or failures.",
    "WATERLOGGING":    "Stop watering. Inspect drainage and improve soil aeration.",
    "HIGH_HUMIDITY":   "Increase ventilation to strip moisture. Reduce watering frequency.",
    "FLOWER_DROP":     "Mist environment to increase humidity. Provide temporary shade.",
    "COLD_STRESS":     "Close vents and reduce airflow. Activate auxiliary heating if available.",
    "ROOT_COLD_STRESS":"Avoid irrigation with cold water. Insulate pots or ground to retain heat.",
}

# ── Helpers: ntfy.sh Push Notifications ──────────────────────────────────────

# Severity → ntfy priority (1=min, 5=max)
NTFY_PRIORITY = {
    "FROST":           5,
    "HEAT_STRESS":     4,
    "ROOT_HEAT_STRESS":4,
    "DROUGHT":         4,
    "WATERLOGGING":    3,
    "HIGH_HUMIDITY":   3,
    "FLOWER_DROP":     3,
    "COLD_STRESS":     3,
    "ROOT_COLD_STRESS":3,
}

def _send_ntfy(topic: str, title: str, message: str, priority: int = 3, tags: list = None):
    """Post a push notification to ntfy.sh — completely free, no API key."""
    if not topic or topic.strip() == "":
        app.logger.warning("No ntfy topic set — notification skipped.")
        return False
    try:
        headers = {
            "Title":    title,
            "Priority": str(priority),
            "Tags":     ",".join(tags or ["seedling"]),
        }
        resp = requests.post(
            f"{NTFY_BASE_URL}/{topic.strip()}",
            data=message.encode("utf-8"),
            headers=headers,
            timeout=10
        )
        if resp.status_code == 200:
            app.logger.info(f"ntfy alert sent to topic '{topic}'")
            return True
        else:
            app.logger.error(f"ntfy error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        app.logger.error(f"ntfy send exception: {e}")
        return False

def _maybe_send_alerts(species: str, condition: dict, sensor_id: str):
    """Check all registered users, apply cooldown, send ntfy push if needed."""
    cond_id = condition["id"]
    if cond_id == "NORMAL":
        return

    cooldown_key = f"{species}:{cond_id}"
    now = time.time()
    last_sent = _alert_cooldown.get(cooldown_key, 0)
    if now - last_sent < ALERT_COOLDOWN_SEC:
        return  # Still in cooldown

    users = _load_users()
    if not users:
        return

    emoji      = condition["emoji"]
    label      = condition["label"]
    tip        = CONDITION_TIPS.get(cond_id, "Check your greenhouse immediately.")
    plant_name = species.capitalize()
    priority   = NTFY_PRIORITY.get(cond_id, 3)
    ist_time   = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%H:%M IST")

    title   = f"{emoji} GreenSim: {label} — {plant_name}"
    message = (
        f"Sensor {sensor_id} | {ist_time}\n"
        f"Action: {tip}"
    )

    alert_sent = False
    for _, user in users.items():
        if user.get("alerts_enabled", True):
            topic = user.get("ntfy_topic", "")
            sent  = _send_ntfy(topic, title, message, priority)
            if sent:
                alert_sent = True

    if alert_sent:
        _alert_cooldown[cooldown_key] = now

# ── Auth Endpoints ────────────────────────────────────────────────────────────

@app.route("/auth/register", methods=["POST"])
def register():
    body       = request.get_json(force=True) or {}
    name       = (body.get("name") or "").strip()
    ntfy_topic = (body.get("ntfy_topic") or "").strip()
    password   = (body.get("password") or "").strip()

    if not name or not ntfy_topic or not password:
        return jsonify({"error": "name, ntfy_topic, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    users = _load_users()
    if ntfy_topic in users:
        return jsonify({"error": "Topic already registered — choose a different one"}), 409

    users[ntfy_topic] = {
        "name":           name,
        "ntfy_topic":     ntfy_topic,
        "password_hash":  _hash_password(password),
        "alerts_enabled": True,
        "created_at":     datetime.utcnow().isoformat()
    }
    _save_users(users)

    token = _create_token(ntfy_topic)
    return jsonify({
        "message": "Registered successfully",
        "token":   token,
        "user":    {"name": name, "ntfy_topic": ntfy_topic, "alerts_enabled": True}
    }), 201

@app.route("/auth/login", methods=["POST"])
def login():
    body       = request.get_json(force=True) or {}
    ntfy_topic = (body.get("ntfy_topic") or "").strip()
    password   = (body.get("password") or "").strip()

    if not ntfy_topic or not password:
        return jsonify({"error": "ntfy_topic and password are required"}), 400

    users = _load_users()
    user  = users.get(ntfy_topic)
    if not user or user["password_hash"] != _hash_password(password):
        return jsonify({"error": "Invalid topic or password"}), 401

    token = _create_token(ntfy_topic)
    return jsonify({
        "token": token,
        "user": {
            "name":           user["name"],
            "ntfy_topic":     user["ntfy_topic"],
            "alerts_enabled": user.get("alerts_enabled", True)
        }
    })

@app.route("/auth/me", methods=["GET"])
@jwt_required
def me():
    u = request.current_user
    return jsonify({
        "name":           u["name"],
        "ntfy_topic":     u["ntfy_topic"],
        "alerts_enabled": u.get("alerts_enabled", True)
    })

@app.route("/auth/update_phone", methods=["POST"])
@jwt_required
def update_phone():
    body = request.get_json(force=True) or {}
    new_phone = (body.get("phone") or "").strip()
    if not new_phone:
        return jsonify({"error": "phone is required"}), 400

    users = _load_users()
    old_phone = request.current_user["phone"]
    user_data = users.pop(old_phone)
    user_data["phone"] = new_phone
    users[new_phone] = user_data
    _save_users(users)

    token = _create_token(new_phone)
    return jsonify({"message": "Phone updated", "token": token})

@app.route("/auth/toggle_alerts", methods=["POST"])
@jwt_required
def toggle_alerts():
    body    = request.get_json(force=True) or {}
    enabled = body.get("enabled", True)

    users = _load_users()
    topic = request.current_user["ntfy_topic"]
    users[topic]["alerts_enabled"] = bool(enabled)
    _save_users(users)
    return jsonify({"alerts_enabled": bool(enabled)})

# ── Sensor Data Endpoints ─────────────────────────────────────────────────────

@app.route("/send_data/<species>", methods=["POST", "GET"])
def send_data(species):
    """
    Accepts sensor data from ESP32 nodes.
    Query params: sensor_number, temperature, humidity, soil_moisture,
                  soil_temperature, light_intensity
    """
    params = request.args if request.method == "GET" else {
        **request.args,
        **(request.get_json(force=True, silent=True) or {})
    }

    sensor_id  = str(params.get("sensor_number", "0"))

    # Universal node (id=0) carries air temp, humidity, light
    # Plant nodes carry soil data
    if sensor_id == "0":
        record = {
            "universal": {
                "room_temperature": float(params.get("temperature", 0)),
                "room_humidity":    float(params.get("humidity", 0)),
                "light_intensity":  float(params.get("light_intensity", 0)),
            },
            "plant": {},
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        # Merge with latest universal if available
        universal_record = _sensor_data.get(f"{species}:0", {}).get("universal", {})
        record = {
            "universal": universal_record,
            "plant": {
                "soil_moisture":   float(params.get("soil_moisture", 0)),
                "temperature":     float(params.get("soil_temperature",
                                        params.get("temperature", 0))),
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    key = f"{species}:{sensor_id}"
    _sensor_data[key] = record

    # ── SMS Health Check ──────────────────────────────────────────────────────
    try:
        t  = float(record["universal"].get("room_temperature", 25))
        rh = float(record["universal"].get("room_humidity", 60))
        sm = float(record["plant"].get("soil_moisture", 50))
        st = float(record["plant"].get("temperature", 20))
        condition = evaluate_plant_health(t, rh, sm, st)
        _maybe_send_alerts(species, condition, sensor_id)
    except Exception as e:
        app.logger.warning(f"Health check failed: {e}")

    return jsonify({"status": "ok", "key": key})

@app.route("/get_data/<species>/<sensor_id>", methods=["GET"])
def get_data(species, sensor_id):
    key = f"{species}:{sensor_id}"
    data = _sensor_data.get(key)
    if not data:
        return jsonify({"error": "No data found"}), 404
    return jsonify(data)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

# ── Vercel Serverless Export ────────────────────────────────────────────────────
# Vercel needs to see 'app' exposed at the module level.
if __name__ == "__main__":
    app.run(debug=True, port=5000)
