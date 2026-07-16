# Cyber Banking Authentication System

A secure, full-stack Cyber Banking Portal implementing multi-factor authentication (OTP) and session management (JWT). This project utilizes a Flask API backend integrated with MongoDB database persistence and a modern React frontend dashboard.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React, Axios, CSS (Vanilla Custom Styles) | Modern component architecture, dynamic state, and responsive layouts. |
| **Backend** | Flask (Python), Flask-CORS, PyMongo | Fast REST APIs, cross-origin request handling, and database driver. |
| **Database** | MongoDB | Document database storing user profiles, OTP sessions, and transactions. |
| **Security** | PyJWT, bcrypt, python-dotenv | Secure stateless tokens, password hashing, and environment decoupling. |
| **Testing** | Postman | Verification of routing, validation, and database operations. |

---

## System Architecture

```
                                    +-----------------------+
                                    |     React Frontend    |
                                    |     (Port 3000)       |
                                    +-----------+-----------+
                                                |
                                        HTTP/JSON (CORS)
                                                |
                                                v
                                    +-----------------------+
                                    |     Flask Backend     |
                                    |     (Port 5000)       |
                                    +-----+-----------+-----+
                                          |           |
                                      JWT / Hashing   | PyMongo Driver
                                          |           |
                                          v           v
                                 +-----------------------------+
                                 |        MongoDB Database     |
                                 |  (users, otp_sessions, txs) |
                                 +-----------------------------+
```

---

## Authentication Flow

1. **User Sign In**: User submits their registered mobile number and password on the login screen.
2. **Credential Checking**: Flask verifies the credentials against the hashed password (using `bcrypt`) in the MongoDB `users` collection.
3. **MFA Verification Trigger**: Upon matching credentials, Flask generates a secure 6-digit OTP code, stores it inside MongoDB's `otp_sessions` collection with a 5-minute expiry threshold, and sends/logs the code.
4. **OTP Verification**: The user enters the 6-digit OTP. The backend validates the code and its timestamp.
5. **Token Issuance**: If the OTP is correct, Flask generates a secure JSON Web Token (JWT) using `PyJWT` and returns it to the client.
6. **Session Storage**: React securely saves the JWT in local storage. All subsequent requests to protected endpoints include the token in the `Authorization: Bearer <JWT>` header.
7. **Session Validation**: Backend validates the incoming JWT payload for any protected transaction or profile endpoint.

---

## API Documentation

### Auth Routes

#### `POST /api/register`
*Registers a new bank account with initial promotional funds.*
* **Body (JSON)**:
  ```json
  {
    "name": "Jane Doe",
    "phone": "919876543210",
    "password": "mySecurePassword"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully. You can now login.",
    "user": { "name": "Jane Doe", "phone": "919876543210", "account_number": "CB12345678" }
  }
  ```

#### `POST /api/login`
*Validates password and issues OTP.*
* **Body (JSON)**:
  ```json
  {
    "phone": "919876543210",
    "password": "mySecurePassword"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to your phone number.",
    "phone": "919876543210"
  }
  ```

#### `POST /api/send-otp`
*Resends the OTP.*
* **Body (JSON)**:
  ```json
  { "phone": "919876543210" }
  ```

#### `POST /api/verify-otp`
*Validates the OTP and returns the JWT authorization token.*
* **Body (JSON)**:
  ```json
  {
    "phone": "919876543210",
    "otp": "123456"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP verified successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "name": "Jane Doe", "phone": "919876543210", "account_number": "CB12345678", "balance": 10000.0 }
  }
  ```

#### `GET /api/profile` *(Protected)*
*Retrieves authenticated profile records.*
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { "name": "Jane Doe", "phone": "919876543210", "account_number": "CB12345678", "balance": 10000.0 }
  }
  ```

#### `POST /api/logout`
*Terminates user session.*
* **Success Response (200 OK)**:
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

---

### Transaction Routes *(All Protected)*

#### `POST /api/transactions/deposit`
*Deposits funds into the authenticated account.*
* **Headers**: `Authorization: Bearer <token>`
* **Body (JSON)**:
  ```json
  { "amount": 500.0 }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Successfully deposited $500.00",
    "amount": 500.0,
    "new_balance": 10500.0
  }
  ```

#### `POST /api/transactions/withdraw`
*Withdraws funds from the authenticated account (verifies sufficient balance).*
* **Headers**: `Authorization: Bearer <token>`
* **Body (JSON)**:
  ```json
  { "amount": 200.0 }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Successfully withdrew $200.00",
    "amount": 200.0,
    "new_balance": 10300.0
  }
  ```

#### `GET /api/transactions`
*Retrieves the sorted transaction log.*
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "transactions": [
      {
        "id": "603d...",
        "type": "withdraw",
        "amount": 200.0,
        "balance_after": 10300.0,
        "timestamp": "2026-07-16T15:02:10.000Z",
        "description": "Withdrew $200.00 via Online Banking"
      }
    ]
  }
  ```

#### `GET /api/transactions/balance`
*Queries account balance.*
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  { "success": true, "balance": 10300.0, "account_number": "CB12345678" }
  ```

---

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm
- MongoDB Server running locally on `mongodb://localhost:27017`

### 1. Database Setup
Ensure your local MongoDB instance is running:
```bash
# Example running MongoDB as a service in Windows PowerShell:
Start-Service MongoDB
```

### 2. Backend Setup (Flask)
Navigate to the backend directory, initialize dependencies, configure env parameters, and boot the server:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Note: Ensure you configure the `.env` settings for parameters like MongoDB URI and JWT Keys.*

### 3. Frontend Setup (React)
Navigate to the frontend directory, install web dependencies, and start the development server:
```bash
cd ../frontend
npm install
npm start
```
The application will launch automatically in your browser at `http://localhost:3000`.

### 4. API Testing
Import the provided Postman collection file `Cyber-Banking-Authentication.postman_collection.json` directly into Postman. Create a local environment specifying `base_url` as `http://localhost:5000` to run the test suite.

---

## Screenshots

*Include snapshots here after deploying locally.*
- **Responsive Login Panel**: Cybernetic glassmorphism authentication interface.
- **OTP Gateway**: 6-digit layout with built-in time expiration check.
- **Client Dashboard**: Interactive panel showing user credentials, live transaction tools, and logs.

---

## Future Enhancements
- Integration of live payment gateways (e.g., Stripe/Razorpay).
- Email notifications using SendGrid.
- Device fingerprinting and IP location logs for enhanced security profiling.
