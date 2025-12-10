# server.py
from flask import Flask, jsonify
from flask_cors import CORS
import random
import time
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # allow all origins for development

# load config once at startup
with open('sensors_config.json', 'r') as f:
    config = json.load(f)

SENSORS = config.get("sensors", [])

def gen_value(s):
    """Generate a random value within s['min']..s['max'] and round appropriately."""
    mn, mx = s.get("min", 0), s.get("max", 100)
    r = random.uniform(mn, mx)
    rounding = s.get("round", 1)
    if rounding == 0:
        r = int(round(r))
    else:
        r = round(r, rounding)
    return r

@app.route('/sensors', methods=['GET'])
def get_sensors():
    """Return an array of sensors with current random values and metadata."""
    now = datetime.utcnow().isoformat() + 'Z'
    sensors_out = []
    for s in SENSORS:
        sensors_out.append({
            "id": s["id"],
            "name": s["name"],
            "value": str(gen_value(s)) + " " + s.get("unit", ""),
            "raw_value": gen_value(s),
            "unit": s.get("unit", ""),
            "timestamp": now,
            "working": True   # placeholder boolean
        })
    return jsonify({
        "timestamp": now,
        "source": "simulated-backend",
        "sensors": sensors_out
    })

@app.route('/config', methods=['GET'])
def get_config():
    """Return the sensor config (optional)."""
    return jsonify(config)

if __name__ == '__main__':
    # use debug=True for development; set host='0.0.0.0' if you want LAN access
    app.run(host='127.0.0.1', port=5000, debug=True)
