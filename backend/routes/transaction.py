import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from utils.helpers import token_required
from bson import ObjectId

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/api/transactions/deposit', methods=['POST'])
@token_required
def deposit():
    """Deposit money into user account (JWT authenticated)."""
    try:
        user_id = request.user_payload['sub']
        data = request.get_json()
        
        if not data or 'amount' not in data:
            return jsonify({'error': 'Deposit amount is required'}), 400
            
        try:
            amount = float(data.get('amount'))
        except ValueError:
            return jsonify({'error': 'Deposit amount must be a number'}), 400
            
        if amount <= 0:
            return jsonify({'error': 'Deposit amount must be greater than zero'}), 400
            
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Update user balance
        current_balance = float(user.get('balance', 0.0))
        new_balance = current_balance + amount
        
        # Atomically increment balance
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"balance": new_balance}}
        )
        
        # Record transaction log
        transaction_doc = {
            "user_id": ObjectId(user_id),
            "phone": user["phone"],
            "type": "deposit",
            "amount": amount,
            "balance_after": new_balance,
            "timestamp": datetime.datetime.utcnow(),
            "description": f"Deposited ${amount:.2f} via Online Banking"
        }
        db.transactions.insert_one(transaction_doc)
        
        return jsonify({
            'success': True,
            'message': f'Successfully deposited ${amount:.2f}',
            'amount': amount,
            'new_balance': new_balance
        }), 200
        
    except Exception as e:
        print(f"Error in deposit: {e}")
        return jsonify({'error': 'Internal server error processing deposit'}), 500

@transaction_bp.route('/api/transactions/withdraw', methods=['POST'])
@token_required
def withdraw():
    """Withdraw money from user account (JWT authenticated)."""
    try:
        user_id = request.user_payload['sub']
        data = request.get_json()
        
        if not data or 'amount' not in data:
            return jsonify({'error': 'Withdrawal amount is required'}), 400
            
        try:
            amount = float(data.get('amount'))
        except ValueError:
            return jsonify({'error': 'Withdrawal amount must be a number'}), 400
            
        if amount <= 0:
            return jsonify({'error': 'Withdrawal amount must be greater than zero'}), 400
            
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        current_balance = float(user.get('balance', 0.0))
        
        # Check sufficient funds
        if current_balance < amount:
            return jsonify({'error': f'Insufficient funds. Current balance: ${current_balance:.2f}'}), 400
            
        new_balance = current_balance - amount
        
        # Atomically decrement balance
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"balance": new_balance}}
        )
        
        # Record transaction log
        transaction_doc = {
            "user_id": ObjectId(user_id),
            "phone": user["phone"],
            "type": "withdraw",
            "amount": amount,
            "balance_after": new_balance,
            "timestamp": datetime.datetime.utcnow(),
            "description": f"Withdrew ${amount:.2f} via Online Banking"
        }
        db.transactions.insert_one(transaction_doc)
        
        return jsonify({
            'success': True,
            'message': f'Successfully withdrew ${amount:.2f}',
            'amount': amount,
            'new_balance': new_balance
        }), 200
        
    except Exception as e:
        print(f"Error in withdraw: {e}")
        return jsonify({'error': 'Internal server error processing withdrawal'}), 500

@transaction_bp.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions():
    """Retrieve user's transaction history (JWT authenticated)."""
    try:
        user_id = request.user_payload['sub']
        db = get_db()
        
        # Fetch transactions sorted by timestamp descending (newest first)
        cursor = db.transactions.find({"user_id": ObjectId(user_id)}).sort("timestamp", -1)
        transactions = []
        
        for doc in cursor:
            transactions.append({
                'id': str(doc['_id']),
                'type': doc['type'],
                'amount': doc['amount'],
                'balance_after': doc['balance_after'],
                'timestamp': doc['timestamp'].isoformat() + 'Z',
                'description': doc.get('description', '')
            })
            
        return jsonify({
            'success': True,
            'transactions': transactions
        }), 200
        
    except Exception as e:
        print(f"Error retrieving transactions: {e}")
        return jsonify({'error': 'Internal server error retrieving transactions'}), 500

@transaction_bp.route('/api/transactions/balance', methods=['GET'])
@token_required
def balance_enquiry():
    """Perform a balance enquiry (JWT authenticated)."""
    try:
        user_id = request.user_payload['sub']
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'success': True,
            'balance': user.get('balance', 0.0),
            'account_number': user.get('account_number', '')
        }), 200
        
    except Exception as e:
        print(f"Error in balance enquiry: {e}")
        return jsonify({'error': 'Internal server error performing balance enquiry'}), 500
