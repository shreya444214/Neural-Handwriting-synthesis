from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    profile_photo = db.Column(db.String(256), nullable=True)
    dob = db.Column(db.String(20), nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    profession = db.Column(db.String(100), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_email_verified = db.Column(db.Boolean, default=False)
    is_phone_verified = db.Column(db.Boolean, default=False)
    theme = db.Column(db.String(10), default='dark')
    notifications_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    files = db.relationship('File', backref='owner', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='sender', lazy=True)
    login_logs = db.relationship('LoginLog', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'profile_photo': self.profile_photo,
            'dob': self.dob,
            'gender': self.gender,
            'profession': self.profession,
            'is_verified': self.is_verified,
            'is_email_verified': self.is_email_verified,
            'is_phone_verified': self.is_phone_verified,
            'theme': self.theme,
            'notifications_enabled': self.notifications_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }


class File(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    original_name = db.Column(db.String(256), nullable=False)
    stored_name = db.Column(db.String(256), nullable=False)
    file_type = db.Column(db.String(20), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='uploaded')  # uploaded, processing, completed, failed
    transform_type = db.Column(db.String(30), nullable=True)  # humanized, ai_generated
    content_text = db.Column(db.Text, nullable=True)
    transformed_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_name': self.original_name,
            'stored_name': self.stored_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'status': self.status,
            'transform_type': self.transform_type,
            'content_text': self.content_text,
            'transformed_text': self.transformed_text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ChatRoom(db.Model):
    __tablename__ = 'chat_rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=True)
    room_type = db.Column(db.String(10), default='individual')  # individual, group
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    members = db.relationship('ChatMember', backref='room', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='room', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'room_type': self.room_type,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'members': [m.to_dict() for m in self.members],
        }


class ChatMember(db.Model):
    __tablename__ = 'chat_members'
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='chat_memberships')
    
    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
        }


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    message_type = db.Column(db.String(10), default='text')  # text, file, system
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    file = db.relationship('File', backref='messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'content': self.content,
            'message_type': self.message_type,
            'file_id': self.file_id,
            'file_name': self.file.original_name if self.file else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LoginLog(db.Model):
    __tablename__ = 'login_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(20), nullable=False)  # login, logout
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(256), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }


class OTP(db.Model):
    __tablename__ = 'otps'
    
    id = db.Column(db.Integer, primary_key=True)
    target = db.Column(db.String(120), nullable=False)  # email or phone number
    otp_code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(20), nullable=False)  # register, reset_password
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
