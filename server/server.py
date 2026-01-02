from flask import Flask, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)

# Helper to generate mock data
def generate_plant_data(plant_id, name):
    return {
        "plant_id": plant_id,
        "name": name,
        "temperature": round(random.uniform(-15, 360), 1),
        "humidity": int(random.uniform(40, 80)),
        "soil_moisture": int(random.uniform(30, 70)),
        "soil_temperature": round(random.uniform(10, 30), 1),
        "light": int(random.uniform(200, 1000)),
        "air_quality": int(random.uniform(0, 500))  # AQI
    }

# Endpoint to get data for all plants
@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors():
    # Simulate realtime data for 3 plants
    data = [
        generate_plant_data("chilli", "Chilli"),
        generate_plant_data("tomato", "Tomato"),
        generate_plant_data("pea", "Pea")
    ]
    
    return jsonify({
        "timestamp": time.time(),
        "plants": data
    })

@app.route('/')
def home():
    return jsonify({"status": "Greenhouse Backend Running", "endpoints": ["/api/sensors/all"]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
