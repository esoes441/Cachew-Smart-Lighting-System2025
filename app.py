from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import os
from datetime import datetime
from models import db, Sensor, Light, Scenario, Automation, User
from flask_socketio import SocketIO, emit

# ------------------ Flask App Initialization ------------------
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = "your_secret_key"

db.init_app(app)

@app.before_first_request
def create_tables():
    db.create_all()

# ------------------ Dashboard and CRUD Routes ------------------
@app.route('/dashboard')
def dashboard():
    sensors = Sensor.query.all()
    lights = Light.query.all()
    scenarios = Scenario.query.all()
    automations = Automation.query.all()
    return render_template('dashboard.html', sensors=sensors, lights=lights,
                           scenarios=scenarios, automations=automations)

# Sensor Routes
@app.route('/sensors', methods=['GET'])
def sensors_list():
    sensors = Sensor.query.all()
    return render_template('sensors.html', sensors=sensors)

@app.route('/sensors/<int:id>', methods=['GET', 'POST'])
def sensor_detail(id):
    sensor = Sensor.query.get_or_404(id)
    if request.method == 'POST':
        sensor.sensor_type = request.form.get('sensor_type', sensor.sensor_type)
        sensor.model = request.form.get('model', sensor.model)
        sensor.location = request.form.get('location', sensor.location)
        sensor.last_value = float(request.form.get('last_value', sensor.last_value))
        sensor.calibration_value = float(request.form.get('calibration_value', sensor.calibration_value))
        sensor.updated_at = datetime.utcnow()
        db.session.commit()
        flash('Sensor updated successfully!', 'success')
        return redirect(url_for('sensors_list'))
    return render_template('sensor_detail.html', sensor=sensor)

# Light Routes
@app.route('/lights', methods=['GET'])
def lights_list():
    lights = Light.query.all()
    return render_template('lights.html', lights=lights)

@app.route('/lights/<int:id>', methods=['GET', 'POST'])
def light_detail(id):
    light = Light.query.get_or_404(id)
    if request.method == 'POST':
        light.state = (request.form.get('state', 'off') == 'on')
        light.brightness = int(request.form.get('brightness', light.brightness))
        light.color = request.form.get('color', light.color)
        light.last_command_time = datetime.utcnow()
        db.session.commit()
        flash('Light updated successfully!', 'success')
        return redirect(url_for('lights_list'))
    return render_template('light_detail.html', light=light)

# Scenario Routes
@app.route('/scenarios', methods=['GET'])
def scenarios_list():
    scenarios = Scenario.query.all()
    return render_template('scenarios.html', scenarios=scenarios)

@app.route('/scenarios/add', methods=['GET','POST'])
def add_scenario():
    if request.method == 'POST':
        name = request.form.get('name')
        settings = request.form.get('settings')
        scenario = Scenario(name=name, settings=settings)
        db.session.add(scenario)
        db.session.commit()
        flash('Scenario added successfully!', 'success')
        return redirect(url_for('scenarios_list'))
    return render_template('scenario_add.html')

# Automation Routes
@app.route('/automations', methods=['GET'])
def automations_list():
    automations = Automation.query.all()
    return render_template('automations.html', automations=automations)

@app.route('/automations/add', methods=['GET', 'POST'])
def add_automation():
    if request.method == 'POST':
        trigger = request.form.get('trigger')
        action = request.form.get('action')
        active = (request.form.get('active', 'off') == 'on')
        automation = Automation(trigger=trigger, action=action, active=active)
        db.session.add(automation)
        db.session.commit()
        flash('Automation added successfully!', 'success')
        return redirect(url_for('automations_list'))
    return render_template('automation_add.html')

# ------------------ ESP32 and Device API Routes ------------------

# POST: Update sensor data from ESP32
@app.route('/api/sensors/update', methods=['POST'])
def sensor_update():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "No JSON payload received"}), 400

    sensor_id = data.get('id')
    sensor_value = data.get('last_value')
    
    sensor = Sensor.query.get(sensor_id)
    if sensor:
        sensor.last_value = sensor_value
        sensor.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"status": "success", "message": "Sensor updated successfully"}), 200
    else:
        return jsonify({"status": "error", "message": "Sensor not found"}), 404

# GET: Retrieve sensor data (by ID)
@app.route('/api/sensors/<int:id>', methods=['GET'])
def get_sensor():
    sensor = Sensor.query.get(id)
    if sensor is None:
        return jsonify({"status": "error", "message": "Sensor not found."}), 404

    sensor_data = {
        "id": sensor.id,
        "sensor_type": sensor.sensor_type,
        "model": sensor.model,
        "location": sensor.location,
        "last_value": sensor.last_value,
        "calibration_value": sensor.calibration_value,
        "updated_at": sensor.updated_at.isoformat() if sensor.updated_at else None
    }
    return jsonify({"status": "success", "sensor": sensor_data}), 200

# POST: Motion event update from ESP32
@app.route('/api/motion/update', methods=['POST'])
def motion_update():
    data = request.get_json()
    if not data or "motion_detected" not in data:
        return jsonify({"status": "error", "message": "Invalid data"}), 400
    motion_state = data["motion_detected"]
    timestamp = data.get("timestamp")
    return jsonify({
        "status": "success",
        "message": "Motion event recorded",
        "motion": motion_state,
        "timestamp": timestamp
    }), 200

# POST: Command update from BLE/ESP32
@app.route('/api/command', methods=['POST'])
def command_update():
    data = request.get_json()
    if not data or "command" not in data:
        return jsonify({"status": "error", "message": "Invalid command data"}), 400
    command = data["command"]
    # Process the command – for example, update device state or trigger automation.
    return jsonify({
        "status": "success",
        "message": "Command processed",
        "command_received": command
    }), 200

# POST: LED status update from ESP32
@app.route('/api/led/update', methods=['POST'])
def led_update():
    data = request.get_json()
    if not data or "state" not in data:
        return jsonify({"status": "error", "message": "Invalid data for LED update"}), 400
    led_state = data["state"]
    timestamp = data.get("timestamp")
    return jsonify({
        "status": "success",
        "message": "LED status updated",
        "state": led_state,
        "timestamp": timestamp
    }), 200

# ------------------ Real-Time Communication via Flask-SocketIO ------------------
socketio = SocketIO(app)

@socketio.on('connect')
def handle_connect():
    print("Client connected via SocketIO")
    emit('initial_data', {'message': 'Connected to real-time server'})

@socketio.on('request_update')
def handle_request_update(data):
    # For example, send latest sensor data.
    sensors = Sensor.query.all()
    sensor_list = []
    for sensor in sensors:
        sensor_list.append({
            "id": sensor.id,
            "last_value": sensor.last_value,
            "updated_at": sensor.updated_at.isoformat() if sensor.updated_at else None
        })
    emit('update', {"sensors": sensor_list})

# ------------------ Scheduled Tasks for Automations using APScheduler ------------------
from apscheduler.schedulers.background import BackgroundScheduler

def check_scheduled_automations():
    now = datetime.now().time()
    # Example simplistic filter: automations scheduled exactly at current time.
    automations = Automation.query.filter(Automation.scheduled_time == now).all()
    for automation in automations:
        print(f"Executing automation ID: {automation.id}, Action: {automation.action}")
        socketio.emit('automation_triggered', {
            "id": automation.id,
            "action": automation.action,
            "triggered_at": datetime.utcnow().isoformat()
        })

scheduler = BackgroundScheduler()
scheduler.add_job(func=check_scheduled_automations, trigger="interval", minutes=1)
scheduler.start()

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)
