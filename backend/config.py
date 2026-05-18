import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'handwriting-transformation-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "handwriting.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-super-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # File uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    PROFILE_PHOTOS_FOLDER = os.path.join(BASE_DIR, 'uploads', 'profiles')
    MAX_CONTENT_LENGTH = 250 * 1024 * 1024  # 250 MB
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'txt'}
    
    # OTP
    OTP_EXPIRY_MINUTES = 5
    
    # CORS — read from env for production, fallback to local dev ports
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', ','.join([
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:5174', 'http://127.0.0.1:5174',
        'http://localhost:5175', 'http://127.0.0.1:5175',
    ])).split(',')
