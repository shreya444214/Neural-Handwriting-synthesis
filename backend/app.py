import os
import random
import string
import uuid
import re
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from config import Config
from models import db, User, File, ChatRoom, ChatMember, Message, LoginLog, OTP

# ── App Setup ──────────────────────────────────────────────────────────────────

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)
db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS, async_mode='threading')

# Create upload directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.PROFILE_PHOTOS_FOLDER, exist_ok=True)
os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'generated'), exist_ok=True)

with app.app_context():
    db.create_all()


# ── Health Check ───────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Handwriting Transformer API is running'}), 200

# ── Helpers ────────────────────────────────────────────────────────────────────

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def extract_text_from_file(filepath, file_type):
    """Extract text content from uploaded files."""
    try:
        if file_type in ('txt',):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        elif file_type in ('pdf',):
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(filepath)
                text = ''
                for page in reader.pages:
                    text += page.extract_text() or ''
                return text
            except Exception:
                return ''
        elif file_type in ('doc', 'docx'):
            try:
                from docx import Document
                doc = Document(filepath)
                return '\n'.join([p.text for p in doc.paragraphs])
            except Exception:
                return ''
        elif file_type in ('xls', 'xlsx'):
            try:
                from openpyxl import load_workbook
                wb = load_workbook(filepath, read_only=True)
                text = ''
                for sheet in wb.sheetnames:
                    ws = wb[sheet]
                    for row in ws.iter_rows(values_only=True):
                        text += ' '.join([str(c) for c in row if c]) + '\n'
                return text
            except Exception:
                return ''
        elif file_type in ('ppt', 'pptx'):
            try:
                from pptx import Presentation
                prs = Presentation(filepath)
                text = ''
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, 'text'):
                            text += shape.text + '\n'
                return text
            except Exception:
                return ''
        elif file_type in ('jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp'):
            try:
                from PIL import Image, ImageFilter, ImageEnhance, ImageOps
                try:
                    import pytesseract
                except ImportError:
                    return '[OCR requires pytesseract package. Install with: pip install pytesseract. Also install Tesseract-OCR from https://github.com/tesseract-ocr/tesseract]'

                # Configure Tesseract path for Windows
                tesseract_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    r'C:\Users\HP\AppData\Local\Programs\Tesseract-OCR\tesseract.exe',
                ]
                tesseract_found = False
                for tp in tesseract_paths:
                    if os.path.exists(tp):
                        pytesseract.pytesseract.tesseract_cmd = tp
                        tesseract_found = True
                        break

                if not tesseract_found:
                    # Try system PATH
                    import shutil
                    if shutil.which('tesseract'):
                        tesseract_found = True

                if not tesseract_found:
                    return '[Tesseract-OCR not found. Please install it from https://github.com/tesseract-ocr/tesseract and ensure it is in your PATH or installed at C:\\Program Files\\Tesseract-OCR\\]'

                img = Image.open(filepath)

                # ── Image preprocessing for better handwriting OCR ──
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                img = ImageOps.grayscale(img)
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(2.0)
                img = img.filter(ImageFilter.SHARPEN)

                w, h = img.size
                if w < 1000:
                    scale = 1000 / w
                    img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

                threshold = 140
                img = img.point(lambda x: 255 if x > threshold else 0, '1')
                img = img.convert('L')

                custom_config = r'--oem 3 --psm 6 -l eng'
                text = pytesseract.image_to_string(img, config=custom_config)

                if len(text.strip()) < 5:
                    custom_config = r'--oem 3 --psm 3 -l eng'
                    text = pytesseract.image_to_string(img, config=custom_config)

                extracted = text.strip()
                if extracted:
                    return extracted
                else:
                    return '[No text could be extracted from this image. Try a clearer image with darker handwriting on lighter paper.]'
            except Exception as e:
                print(f"OCR failed: {e}")
                import traceback
                traceback.print_exc()
                return f'[OCR extraction failed: {str(e)}]'
    except Exception:
        return ''
    return ''


def humanize_text(text):
    """Convert AI-generated text into more human/handwritten-style text."""
    if not text:
        return text
    
    # Simple humanization: add natural variations
    replacements = {
        'therefore': 'so',
        'however': 'but',
        'additionally': 'also',
        'furthermore': 'plus',
        'consequently': 'so',
        'nevertheless': 'still',
        'subsequently': 'then',
        'approximately': 'about',
        'utilize': 'use',
        'demonstrate': 'show',
        'implement': 'do',
        'facilitate': 'help',
        'endeavor': 'try',
        'commence': 'start',
        'terminate': 'end',
        'sufficient': 'enough',
        'numerous': 'many',
        'regarding': 'about',
        'in order to': 'to',
        'due to the fact that': 'because',
        'in the event that': 'if',
        'at this point in time': 'now',
        'for the purpose of': 'to',
        'in spite of the fact that': 'although',
        'it is important to note that': '',
        'it should be noted that': '',
    }
    
    result = text
    for formal, casual in replacements.items():
        result = re.sub(r'\b' + re.escape(formal) + r'\b', casual, result, flags=re.IGNORECASE)
    
    return result


def formalize_text(text):
    """Convert humanized/handwritten text into more formal AI-generated style."""
    if not text:
        return text
    
    replacements = {
        r'\bso\b': 'therefore',
        r'\bbut\b': 'however',
        r'\balso\b': 'additionally',
        r'\bplus\b': 'furthermore',
        r'\bstill\b': 'nevertheless',
        r'\bthen\b': 'subsequently',
        r'\babout\b': 'approximately',
        r'\buse\b': 'utilize',
        r'\bshow\b': 'demonstrate',
        r'\bhelp\b': 'facilitate',
        r'\btry\b': 'endeavor',
        r'\bstart\b': 'commence',
        r'\bend\b': 'terminate',
        r'\benough\b': 'sufficient',
        r'\bmany\b': 'numerous',
        r'\bget\b': 'obtain',
        r'\bgive\b': 'provide',
        r'\bbig\b': 'significant',
        r'\bsmall\b': 'minimal',
        r'\bgood\b': 'excellent',
        r'\bbad\b': 'unfavorable',
    }
    
    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    # Capitalize first letter of sentences
    result = '. '.join(s.strip().capitalize() for s in result.split('. ') if s.strip())
    
    return result


# ── Auth Endpoints ─────────────────────────────────────────────────────────────

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    target = data.get('target', '').strip()
    purpose = data.get('purpose', 'register')
    
    if not target:
        return jsonify({'error': 'Email or phone number is required'}), 400
    
    # Invalidate previous OTPs
    OTP.query.filter_by(target=target, is_used=False).update({'is_used': True})
    
    otp_code = generate_otp()
    new_otp = OTP(
        target=target,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
    )
    db.session.add(new_otp)
    db.session.commit()
    
    # In production, send via email/SMS service
    print(f"\n{'='*50}")
    print(f"  OTP for {target}: {otp_code}")
    print(f"  Purpose: {purpose}")
    print(f"  Expires in {Config.OTP_EXPIRY_MINUTES} minutes")
    print(f"{'='*50}\n")
    
    return jsonify({
        'message': f'OTP sent to {target}',
        'otp_debug': otp_code  # Remove in production!
    }), 200


@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    target = data.get('target', '').strip()
    otp_code = data.get('otp', '').strip()
    purpose = data.get('purpose', 'register')
    
    if not target or not otp_code:
        return jsonify({'error': 'Target and OTP are required'}), 400
    
    otp_record = OTP.query.filter_by(
        target=target,
        otp_code=otp_code,
        purpose=purpose,
        is_used=False
    ).first()
    
    if not otp_record:
        return jsonify({'error': 'Invalid OTP'}), 400
    
    if otp_record.expires_at < datetime.utcnow():
        return jsonify({'error': 'OTP has expired'}), 400
    
    otp_record.is_used = True
    db.session.commit()
    
    return jsonify({'message': 'OTP verified successfully', 'verified': True}), 200


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    name = data.get('name', '').strip()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    dob = data.get('dob', '')
    gender = data.get('gender', '')
    profession = data.get('profession', '')
    
    # Validation
    if not all([name, username, email, password]):
        return jsonify({'error': 'Name, username, email, and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    new_user = User(
        name=name,
        username=username,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        dob=dob,
        gender=gender,
        profession=profession,
        is_verified=True,
        is_email_verified=True,
        is_phone_verified=bool(phone)
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(new_user.id))
    refresh_token = create_refresh_token(identity=str(new_user.id))
    
    # Log registration
    log = LoginLog(user_id=new_user.id, action='register', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': f'Welcome {name}! Registration successful.',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': new_user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    user.last_login = datetime.utcnow()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    # Log login
    log = LoginLog(user_id=user.id, action='login', ip_address=request.remote_addr,
                   user_agent=request.headers.get('User-Agent', '')[:256])
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': f'Welcome back, {user.name}!',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    log = LoginLog(user_id=user_id, action='logout', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'No account found with this email'}), 404
    
    # Invalidate previous OTPs
    OTP.query.filter_by(target=email, purpose='reset_password', is_used=False).update({'is_used': True})
    
    otp_code = generate_otp()
    new_otp = OTP(
        target=email,
        otp_code=otp_code,
        purpose='reset_password',
        expires_at=datetime.utcnow() + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
    )
    db.session.add(new_otp)
    db.session.commit()
    
    print(f"\n{'='*50}")
    print(f"  PASSWORD RESET OTP for {email}: {otp_code}")
    print(f"{'='*50}\n")
    
    return jsonify({
        'message': 'Password reset OTP sent to your email',
        'otp_debug': otp_code
    }), 200


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    otp_code = data.get('otp', '').strip()
    new_password = data.get('new_password', '')
    
    if not all([email, otp_code, new_password]):
        return jsonify({'error': 'Email, OTP, and new password are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    otp_record = OTP.query.filter_by(
        target=email, otp_code=otp_code, purpose='reset_password', is_used=False
    ).first()
    
    if not otp_record or otp_record.expires_at < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.password_hash = generate_password_hash(new_password)
    otp_record.is_used = True
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully'}), 200


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    user_id = get_jwt_identity()
    new_token = create_access_token(identity=user_id)
    return jsonify({'access_token': new_token}), 200


# ── Profile Endpoints ──────────────────────────────────────────────────────────

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    file_count = File.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'user': user.to_dict(),
        'stats': {
            'total_files': file_count,
            'account_age_days': (datetime.utcnow() - user.created_at).days if user.created_at else 0,
        }
    }), 200


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name'].strip()
    if 'phone' in data:
        user.phone = data['phone'].strip()
    if 'dob' in data:
        user.dob = data['dob']
    if 'gender' in data:
        user.gender = data['gender']
    if 'profession' in data:
        user.profession = data['profession']
    if 'theme' in data:
        user.theme = data['theme']
    if 'notifications_enabled' in data:
        user.notifications_enabled = data['notifications_enabled']
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200


@app.route('/api/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
    filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(Config.PROFILE_PHOTOS_FOLDER, filename)
    file.save(filepath)
    
    user.profile_photo = filename
    db.session.commit()
    
    return jsonify({'message': 'Profile photo updated', 'photo': filename}), 200


@app.route('/api/profile/photo/<filename>', methods=['GET'])
def serve_profile_photo(filename):
    return send_from_directory(Config.PROFILE_PHOTOS_FOLDER, filename)


@app.route('/api/profile/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200


# ── File Endpoints ─────────────────────────────────────────────────────────────

@app.route('/api/files/upload', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = int(get_jwt_identity())
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed: {", ".join(Config.ALLOWED_EXTENSIONS)}'}), 400
    
    original_name = secure_filename(file.filename)
    ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else 'txt'
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, stored_name)
    
    file.save(filepath)
    file_size = os.path.getsize(filepath)
    
    # Extract text
    content_text = extract_text_from_file(filepath, ext)
    
    new_file = File(
        user_id=user_id,
        original_name=file.filename,
        stored_name=stored_name,
        file_type=ext,
        file_size=file_size,
        status='uploaded',
        content_text=content_text
    )
    
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify({
        'message': 'File uploaded successfully',
        'file': new_file.to_dict()
    }), 201


@app.route('/api/files/upload-text', methods=['POST'])
@jwt_required()
def upload_text():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    text = data.get('text', '').strip()
    name = data.get('name', 'Pasted Text').strip()
    
    if not text:
        return jsonify({'error': 'Text content is required'}), 400
    
    stored_name = f"{uuid.uuid4().hex}.txt"
    filepath = os.path.join(Config.UPLOAD_FOLDER, stored_name)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    
    new_file = File(
        user_id=user_id,
        original_name=name,
        stored_name=stored_name,
        file_type='txt',
        file_size=len(text.encode('utf-8')),
        status='uploaded',
        content_text=text
    )
    
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify({
        'message': 'Text saved successfully',
        'file': new_file.to_dict()
    }), 201


@app.route('/api/files', methods=['GET'])
@jwt_required()
def list_files():
    user_id = int(get_jwt_identity())
    files = File.query.filter_by(user_id=user_id).order_by(File.created_at.desc()).all()
    return jsonify({'files': [f.to_dict() for f in files]}), 200


@app.route('/api/files/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404
    return jsonify({'file': file.to_dict()}), 200


@app.route('/api/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404
    
    # Delete physical file
    filepath = os.path.join(Config.UPLOAD_FOLDER, file.stored_name)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.session.delete(file)
    db.session.commit()
    
    return jsonify({'message': 'File deleted successfully'}), 200


@app.route('/api/files/<int:file_id>/transform', methods=['POST'])
@jwt_required()
def transform_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404
    
    data = request.get_json()
    transform_type = data.get('transform_type', 'humanized')  # humanized or ai_generated
    text_content = data.get('text_content', file.content_text or '')
    
    # Apply transformation
    if transform_type == 'humanized':
        transformed = humanize_text(text_content)
    elif transform_type == 'ai_generated':
        transformed = formalize_text(text_content)
    else:
        transformed = text_content
    
    file.status = 'completed'
    file.transform_type = transform_type
    file.transformed_text = transformed
    file.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': f'File transformed to {transform_type} successfully',
        'file': file.to_dict(),
        'transformed_text': transformed,
    }), 200


@app.route('/api/files/transform-text', methods=['POST'])
@jwt_required()
def transform_text_direct():
    """Transform text directly without a file — for quick transformations."""
    data = request.get_json()
    text_content = data.get('text', '').strip()
    transform_type = data.get('transform_type', 'humanized')
    
    if not text_content:
        return jsonify({'error': 'Text content is required'}), 400
    
    if transform_type == 'humanized':
        transformed = humanize_text(text_content)
    elif transform_type == 'ai_generated':
        transformed = formalize_text(text_content)
    else:
        transformed = text_content
    
    return jsonify({
        'transformed_text': transformed,
        'transform_type': transform_type,
    }), 200


@app.route('/api/files/<int:file_id>/download', methods=['GET'])
@jwt_required()
def download_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404
    
    return send_from_directory(Config.UPLOAD_FOLDER, file.stored_name, 
                               as_attachment=True, download_name=file.original_name)


# ── Dashboard Endpoints ────────────────────────────────────────────────────────

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    user_id = int(get_jwt_identity())
    
    total = File.query.filter_by(user_id=user_id).count()
    uploaded = File.query.filter_by(user_id=user_id, status='uploaded').count()
    processing = File.query.filter_by(user_id=user_id, status='processing').count()
    completed = File.query.filter_by(user_id=user_id, status='completed').count()
    failed = File.query.filter_by(user_id=user_id, status='failed').count()
    
    recent_files = File.query.filter_by(user_id=user_id)\
        .order_by(File.created_at.desc()).limit(10).all()
    
    login_logs = LoginLog.query.filter_by(user_id=user_id)\
        .order_by(LoginLog.timestamp.desc()).limit(5).all()
    
    return jsonify({
        'stats': {
            'total_files': total,
            'uploaded': uploaded,
            'processing': processing,
            'completed': completed,
            'failed': failed,
        },
        'recent_files': [f.to_dict() for f in recent_files],
        'recent_activity': [l.to_dict() for l in login_logs],
    }), 200


# ── Chat Endpoints ─────────────────────────────────────────────────────────────

@app.route('/api/chat/users', methods=['GET'])
@jwt_required()
def search_users():
    user_id = int(get_jwt_identity())
    query = request.args.get('q', '').strip()
    
    if query:
        users = User.query.filter(
            User.id != user_id,
            (User.name.ilike(f'%{query}%') | User.username.ilike(f'%{query}%'))
        ).limit(20).all()
    else:
        users = User.query.filter(User.id != user_id).limit(20).all()
    
    return jsonify({
        'users': [{'id': u.id, 'name': u.name, 'username': u.username, 'profile_photo': u.profile_photo} for u in users]
    }), 200


@app.route('/api/chat/rooms', methods=['GET'])
@jwt_required()
def get_chat_rooms():
    user_id = int(get_jwt_identity())
    
    memberships = ChatMember.query.filter_by(user_id=user_id).all()
    room_ids = [m.room_id for m in memberships]
    rooms = ChatRoom.query.filter(ChatRoom.id.in_(room_ids)).all() if room_ids else []
    
    rooms_data = []
    for room in rooms:
        last_msg = Message.query.filter_by(room_id=room.id)\
            .order_by(Message.created_at.desc()).first()
        
        room_dict = room.to_dict()
        room_dict['last_message'] = last_msg.to_dict() if last_msg else None
        
        # For individual chats, show the other person's name
        if room.room_type == 'individual':
            other_member = ChatMember.query.filter(
                ChatMember.room_id == room.id, ChatMember.user_id != user_id
            ).first()
            if other_member and other_member.user:
                room_dict['display_name'] = other_member.user.name
                room_dict['display_photo'] = other_member.user.profile_photo
            else:
                room_dict['display_name'] = room.name or 'Unknown'
                room_dict['display_photo'] = None
        else:
            room_dict['display_name'] = room.name
            room_dict['display_photo'] = None
        
        rooms_data.append(room_dict)
    
    return jsonify({'rooms': rooms_data}), 200


@app.route('/api/chat/rooms', methods=['POST'])
@jwt_required()
def create_chat_room():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    room_type = data.get('type', 'individual')
    name = data.get('name', '')
    member_ids = data.get('members', [])
    
    if room_type == 'individual' and len(member_ids) == 1:
        other_user_id = member_ids[0]
        # Check if room already exists
        existing_rooms = db.session.query(ChatRoom).join(ChatMember).filter(
            ChatRoom.room_type == 'individual',
            ChatMember.user_id == user_id
        ).all()
        
        for r in existing_rooms:
            other = ChatMember.query.filter(
                ChatMember.room_id == r.id, ChatMember.user_id == other_user_id
            ).first()
            if other:
                return jsonify({'room': r.to_dict(), 'message': 'Room already exists'}), 200
    
    new_room = ChatRoom(
        name=name if room_type == 'group' else None,
        room_type=room_type,
        created_by=user_id
    )
    db.session.add(new_room)
    db.session.flush()
    
    # Add creator as member
    db.session.add(ChatMember(room_id=new_room.id, user_id=user_id))
    
    # Add other members
    for mid in member_ids:
        if mid != user_id:
            db.session.add(ChatMember(room_id=new_room.id, user_id=mid))
    
    db.session.commit()
    
    return jsonify({
        'room': new_room.to_dict(),
        'message': 'Chat room created'
    }), 201


@app.route('/api/chat/rooms/<int:room_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(room_id):
    user_id = int(get_jwt_identity())
    
    # Verify membership
    member = ChatMember.query.filter_by(room_id=room_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Not a member of this room'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    messages = Message.query.filter_by(room_id=room_id)\
        .order_by(Message.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'messages': [m.to_dict() for m in reversed(messages.items)],
        'has_more': messages.has_next,
        'total': messages.total,
    }), 200


@app.route('/api/chat/rooms/<int:room_id>/share-file', methods=['POST'])
@jwt_required()
def share_file_in_chat(room_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    file_id = data.get('file_id')
    
    member = ChatMember.query.filter_by(room_id=room_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Not a member of this room'}), 403
    
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404
    
    msg = Message(
        room_id=room_id,
        sender_id=user_id,
        content=f'Shared file: {file.original_name}',
        message_type='file',
        file_id=file_id
    )
    db.session.add(msg)
    db.session.commit()
    
    socketio.emit('new_message', msg.to_dict(), room=f'room_{room_id}')
    
    return jsonify({'message': 'File shared', 'msg': msg.to_dict()}), 200


# ── Settings Endpoints ─────────────────────────────────────────────────────────

@app.route('/api/settings', methods=['GET'])
@jwt_required()
def get_settings():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'settings': {
            'theme': user.theme,
            'notifications_enabled': user.notifications_enabled,
            'email': user.email,
            'phone': user.phone,
        }
    }), 200


@app.route('/api/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'theme' in data:
        user.theme = data['theme']
    if 'notifications_enabled' in data:
        user.notifications_enabled = data['notifications_enabled']
    if 'email' in data and data['email'] != user.email:
        if User.query.filter(User.email == data['email'], User.id != user_id).first():
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    return jsonify({'message': 'Settings updated', 'settings': {
        'theme': user.theme,
        'notifications_enabled': user.notifications_enabled,
    }}), 200


@app.route('/api/settings/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    password = data.get('password', '')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid password'}), 401
    
    # Delete user's files
    files = File.query.filter_by(user_id=user_id).all()
    for f in files:
        filepath = os.path.join(Config.UPLOAD_FOLDER, f.stored_name)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Account deleted successfully'}), 200


# ── Socket.IO Events ──────────────────────────────────────────────────────────

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    join_room(f'room_{room_id}')
    emit('user_joined', {'user_id': user_id, 'room_id': room_id}, room=f'room_{room_id}')


@socketio.on('leave_room')
def handle_leave_room(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    leave_room(f'room_{room_id}')
    emit('user_left', {'user_id': user_id, 'room_id': room_id}, room=f'room_{room_id}')


@socketio.on('send_message')
def handle_send_message(data):
    room_id = data.get('room_id')
    sender_id = data.get('sender_id')
    content = data.get('content', '')
    message_type = data.get('message_type', 'text')
    file_id = data.get('file_id')
    
    with app.app_context():
        msg = Message(
            room_id=room_id,
            sender_id=sender_id,
            content=content,
            message_type=message_type,
            file_id=file_id
        )
        db.session.add(msg)
        db.session.commit()
        
        emit('new_message', msg.to_dict(), room=f'room_{room_id}')


@socketio.on('typing')
def handle_typing(data):
    room_id = data.get('room_id')
    user_name = data.get('user_name')
    emit('user_typing', {'user_name': user_name}, room=f'room_{room_id}', include_self=False)


@socketio.on('stop_typing')
def handle_stop_typing(data):
    room_id = data.get('room_id')
    emit('user_stop_typing', {}, room=f'room_{room_id}', include_self=False)


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  [*] Handwriting Transformation Backend")
    print("  [>] Running on http://127.0.0.1:5000")
    print("  [#] Upload folder:", Config.UPLOAD_FOLDER)
    print("="*60 + "\n")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

