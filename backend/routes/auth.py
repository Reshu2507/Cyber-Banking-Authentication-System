import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from utils.helpers import hash_password, check_password, generate_otp, generate_token, send_sms, token_required
from bson import ObjectId
import random

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a new user (convenience helper for demo / database setup)."""
    try:
        data = request.get_json()
        name = data.get('name')
        phone = data.get('phone')
        password = data.get('password')
        
        if not name or not phone or not password:
            return jsonify({'error': 'Name, phone number, and password are required'}), 400
            
        db = get_db()
        # Clean phone
        phone = ''.join(filter(str.isdigit, phone))
        if not phone or len(phone) < 10:
            return jsonify({'error': 'Invalid phone number format. Must be at least 10 digits.'}), 400
            
        # Check if user already exists
        if db.users.find_one({"phone": phone}):
            return jsonify({'error': 'A user with this phone number already exists'}), 400
            
        # Create unique account number
        account_number = "CB" + "".join(str(random.randint(0, 9)) for _ in range(8))
        
        hashed = hash_password(password)
        
        user_doc = {
            "name": name,
            "phone": phone,
            "password": hashed,
            "account_number": account_number,
            "balance": 10000.0, # Initial promotional balance
            "created_at": datetime.datetime.utcnow()
        }
        
        db.users.insert_one(user_doc)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully. You can now login.',
            'user': {
                'name': name,
                'phone': phone,
                'account_number': account_number
            }
        }), 201
        
    except Exception as e:
        print(f"Error in register: {e}")
        return jsonify({'error': 'Internal server error during registration'}), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Verify phone and password, then send OTP."""
    try:
        data = request.get_json()
        phone = data.get('phone')
        password = data.get('password')
        
        if not phone or not password:
            return jsonify({'error': 'Phone number and password are required'}), 400
            
        # Clean phone
        phone = ''.join(filter(str.isdigit, phone))
        
        db = get_db()
        user = db.users.find_one({"phone": phone})
        
        if not user:
            return jsonify({'error': 'User not found. Please register first.'}), 404
            
        if not check_password(password, user["password"]):
            return jsonify({'error': 'Invalid password'}), 401
            
        # Credentials valid! Generate and send OTP
        otp = generate_otp()
        expiry_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        db.otp_sessions.update_one(
            {"phone": phone},
            {
                "$set": {
                    "otp": otp,
                    "expiry": expiry_time,
                    "verified": False,
                    "timestamp": datetime.datetime.utcnow()
                }
            },
            upsert=True
        )
        
        message = f"Your Cyber Banking Verification Code is {otp}. Valid for 5 minutes."
        send_sms(phone, message, otp)
        
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully to your phone number.',
            'phone': phone
        }), 200
        
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({'error': 'Internal server error during login'}), 500

@auth_bp.route('/api/send-otp', methods=['POST'])
def resend_otp():
    """Explicitly resend OTP to user."""
    try:
        data = request.get_json()
        phone = data.get('phone')
        
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
            
        phone = ''.join(filter(str.isdigit, phone))
        db = get_db()
        
        # Verify user exists
        user = db.users.find_one({"phone": phone})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        otp = generate_otp()
        expiry_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        db.otp_sessions.update_one(
            {"phone": phone},
            {
                "$set": {
                    "otp": otp,
                    "expiry": expiry_time,
                    "verified": False,
                    "timestamp": datetime.datetime.utcnow()
                }
            },
            upsert=True
        )
        
        message = f"Your new Cyber Banking Verification Code is {otp}. Valid for 5 minutes."
        send_sms(phone, message, otp)
        
        return jsonify({
            'success': True,
            'message': 'OTP resent successfully.',
            'phone': phone
        }), 200
        
    except Exception as e:
        print(f"Error in send-otp: {e}")
        return jsonify({'error': 'Internal server error sending OTP'}), 500

@auth_bp.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and return JWT."""
    try:
        data = request.get_json()
        phone = data.get('phone')
        otp = data.get('otp')
        
        if not phone or not otp:
            return jsonify({'error': 'Phone number and OTP are required'}), 400
            
        phone = ''.join(filter(str.isdigit, phone))
        db = get_db()
        
        session = db.otp_sessions.find_one({"phone": phone})
        if not session:
            return jsonify({'error': 'No active login session found. Please request a new OTP.'}), 400
            
        # Check expiration
        now = datetime.datetime.utcnow()
        if session["expiry"] < now:
            db.otp_sessions.delete_one({"phone": phone})
            return jsonify({'error': 'OTP has expired. Please login again to request a new one.'}), 400
            
        # Check matching code
        if session["otp"] != str(otp).strip():
            return jsonify({'error': 'Invalid OTP code. Please try again.'}), 400
            
        # Success! Clear OTP session
        db.otp_sessions.delete_one({"phone": phone})
        
        # Load user
        user = db.users.find_one({"phone": phone})
        if not user:
            return jsonify({'error': 'User record not found.'}), 404
            
        # Issue JWT Token
        token = generate_token(phone, user["_id"])
        
        return jsonify({
            'success': True,
            'message': 'OTP verified successfully.',
            'token': token,
            'user': {
                'name': user['name'],
                'phone': user['phone'],
                'account_number': user['account_number'],
                'balance': user['balance']
            }
        }), 200
        
    except Exception as e:
        print(f"Error in verify-otp: {e}")
        return jsonify({'error': 'Internal server error verifying OTP'}), 500

@auth_bp.route('/api/profile', methods=['GET'])
@token_required
def profile():
    """Get authenticated user profile details."""
    try:
        user_id = request.user_payload['sub']
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User session invalid or user not found'}), 404
            
        return jsonify({
            'success': True,
            'user': {
                'name': user['name'],
                'phone': user['phone'],
                'account_number': user['account_number'],
                'balance': user['balance']
            }
        }), 200
        
    except Exception as e:
        print(f"Error in profile: {e}")
        return jsonify({'error': 'Internal server error retrieving profile'}), 500

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint."""
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200
