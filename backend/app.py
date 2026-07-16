import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db
from routes.auth import auth_bp
from routes.transaction import transaction_bp

def create_app():
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Enable Cross-Origin Resource Sharing (CORS)
    # Allows React frontend to communicate with API endpoints
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize MongoDB connection
    try:
        init_db(app)
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        print("Make sure MongoDB is running locally at mongodb://localhost:27017 or update MONGO_URI in .env")


    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(transaction_bp)

    @app.route('/')
    def index():
        return jsonify({
            'status': 'healthy',
            'message': 'Welcome to the Cyber Banking Authentication API Server',
            'version': '1.0.0'
        }), 200

    # Custom 404 error handler
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    # Custom 500 error handler
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Run the server
    # host='0.0.0.0' is essential for networking/Docker/external access
    app.run(host='0.0.0.0', port=port, debug=True)
