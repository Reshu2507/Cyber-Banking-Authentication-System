import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cyber_banking")
    JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-cyber-banking-key-2026")
    OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
    SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console")
    PORT = int(os.getenv("PORT", "5000"))
    
    # Twilio configurations (optional, falls back to console simulation if empty)
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Fast2SMS configuration (optional)
    FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
