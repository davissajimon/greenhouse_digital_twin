from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ---- STORE LATEST SENSOR DATA ----
latest_data = {
    "soil_moisture": None,
    "temperature": None,
    "timestamp": None
}

# ---- ESP32 SENDS DATA HERE ----
@app.route('/api/esp32/upload', methods=['POST'])
def receive_esp32_data():
    global latest_data
    data = request.json

    latest_data = {
        "soil_moisture": data.get("soil_moisture"),
        "temperature": data.get("temperature"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    return jsonify({"status": "success"}), 200


# ---- FRONTEND FETCHES DATA HERE ----
@app.route('/api/sensors', methods=['GET'])
def get_sensor_data():
    return jsonify({
        "source": "esp32-live",
        "data": latest_data
    })


# ---- HEALTH CHECK ----
@app.route('/')
def home():
    return jsonify({"status": "ESP32 Sensor Backend Running"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
