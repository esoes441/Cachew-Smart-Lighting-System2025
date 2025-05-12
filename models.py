from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Sensor(db.Model):
    __tablename__ = 'sensors'
    id = db.Column(db.Integer, primary_key=True)
    sensor_type = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50))
    location = db.Column(db.String(100))
    last_value = db.Column(db.Float)
    calibration_value = db.Column(db.Float, default=1.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class Light(db.Model):
    __tablename__ = 'lights'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    state = db.Column(db.Boolean, default=False)
    brightness = db.Column(db.Integer, default=100)
    color = db.Column(db.String(20))
    last_command_time = db.Column(db.DateTime, default=datetime.utcnow)

class Scenario(db.Model):
    __tablename__ = 'scenarios'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    settings = db.Column(db.Text)  # JSON string describing scene parameters

class Automation(db.Model):
    __tablename__ = 'automations'
    id = db.Column(db.Integer, primary_key=True)
    trigger = db.Column(db.String(100))
    action = db.Column(db.String(100))
    active = db.Column(db.Boolean, default=True)
    scheduled_time = db.Column(db.Time)  # For scheduled automations

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user')
    preferences = db.Column(db.Text)  # JSON string for user-specific settings

class ScheduledEvent(db.Model):
    __tablename__ = 'scheduled_events'
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.String(5))      # "14:30" could be stored as a string or as a Time field
    mode = db.Column(db.String(50))     # e.g., "party"
    strips = db.Column(db.String(100))  # e.g., "14,15,16"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
