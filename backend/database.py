from pymongo import MongoClient
from config import Config

client = None
db = None

def init_db(app=None):
    """Initialize MongoDB connection."""
    global client, db
    uri = Config.MONGO_URI
    # Extract database name from connection string or default to cyber_banking
    db_name = "cyber_banking"
    
    # Parse DB name if present in URI
    if "/" in uri.replace("mongodb://", "").replace("mongodb+srv://", ""):
        parts = uri.split("/")
        if parts[-1]:
            db_name = parts[-1].split("?")[0]
            
    client = MongoClient(uri)
    db = client[db_name]
    print(f"Connected to MongoDB database: {db_name}")
    return db

def get_db():
    """Retrieve database instance."""
    global db
    if db is None:
        init_db()
    return db
