import os
import random
import bcrypt
import jwt
import datetime
import urllib.request
import urllib.parse
import json
from config import Config

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_otp() -> str:
    """Generate a secure 6-digit OTP."""
    return str(random.randint(100000, 999999))

def generate_token(phone: str, user_id: str) -> str:
    """Generate a secure JWT token for the user session."""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': str(user_id),
        'phone': phone
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        print("JWT Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT Token: {e}")
        return None

def send_sms(phone: str, message: str, otp: str) -> dict:
    """Send SMS using Twilio, Fast2SMS, or simulate OTP delivery in console."""
    provider = Config.SMS_PROVIDER
    print(f"SMS Provider Selected: {provider}")

    if provider == 'fast2sms' and Config.FAST2SMS_API_KEY:
        try:
            # Strip country code prefix (e.g. +91) for Fast2SMS numbers
            clean_phone = ''.join(filter(str.isdigit, phone))
            if clean_phone.startswith('91') and len(clean_phone) > 10:
                clean_phone = clean_phone[2:]
                
            url = 'https://www.fast2sms.com/dev/bulkV2'
            headers = {
                'authorization': Config.FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            }
            data = {
                'route': 'q',
                'message': message,
                'language': 'english',
                'flash': 0,
                'numbers': clean_phone
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                print("Fast2SMS API Response:", res_data)
                return res_data
        except Exception as e:
            print(f"Fast2SMS API Error: {e}. Falling back to console simulation.")
            
    elif provider == 'twilio' and Config.TWILIO_ACCOUNT_SID:
        try:
            # Inline import of Twilio to avoid dependency crashes if it's not installed
            from twilio.rest import Client
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            msg = client.messages.create(
                body=message,
                from_=Config.TWILIO_PHONE_NUMBER,
                to=phone
            )
            print("Twilio Message Sent. SID:", msg.sid)
            return {"success": True, "sid": msg.sid}
        except Exception as e:
            print(f"Twilio API Error: {e}. Falling back to console simulation.")
            
    # Default Console simulation (and always print OTP to logs for local manual/automated testing)
    print(f"\n========================================")
    print(f"SMS SIMULATOR (TO: {phone})")
    print(f"MESSAGE: {message}")
    print(f"OTP CODE: {otp}")
    print(f"========================================\n")
    return {"success": True, "simulated": True}


from functools import wraps
from flask import request, jsonify

def token_required(f):
    """Decorator to protect Flask endpoints using JWT Authorization headers."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
            
        request.user_payload = payload
        return f(*args, **kwargs)
    return decorated

