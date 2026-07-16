# Cyber Banking Authentication System

A secure full-stack Cyber Banking Authentication System developed using React, Flask, and MongoDB. The application implements OTP-based Multi-Factor Authentication (MFA) and JWT-based session management to provide secure user authentication and protected banking transactions through REST APIs.

---

## Features

- User Registration and Login
- OTP-based Multi-Factor Authentication
- JWT Authentication and Authorization
- Secure Password Hashing using bcrypt
- Protected REST APIs
- User Profile Management
- Deposit and Withdraw Transactions
- Account Balance Inquiry
- Transaction History
- MongoDB Integration
- API Testing using Postman

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Axios, CSS |
| Backend | Flask, Flask-CORS |
| Database | MongoDB (PyMongo) |
| Authentication | JWT (PyJWT), OTP |
| Security | bcrypt, python-dotenv |
| API Testing | Postman |

---

## Project Structure

```
Cyber-Banking-Authentication-System
│
├── backend
│   ├── routes
│   │   ├── auth.py
│   │   └── transaction.py
│   │
│   ├── utils
│   │
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   └── requirements.txt
│
├── frontend
│   ├── public
│   │   └── index.html
│   │
│   ├── src
│   │   ├── components
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   │
│   └── package-lock.json
│
└── README.md
```

---

## System Architecture

```
                 React Frontend
                        │
                 REST API Requests
                        │
                        ▼
                 Flask Backend
                        │
      ┌─────────────────┴─────────────────┐
      │                                   │
 JWT Authentication                  MongoDB
      │                                   │
      └───────────────┬───────────────────┘
                      │
              Banking Operations
```

---

## Authentication Flow

1. User registers using a mobile number and password.
2. Password is hashed using bcrypt and stored in MongoDB.
3. User logs in with valid credentials.
4. Flask validates the credentials.
5. A secure 6-digit OTP is generated.
6. OTP is stored with an expiry time.
7. User enters the OTP.
8. Flask verifies the OTP.
9. A JWT token is generated.
10. React stores the JWT.
11. Protected API requests include the JWT in the Authorization header.
12. Flask validates the JWT before granting access.

---

## REST API Endpoints

### Authentication APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Validate credentials and generate OTP |
| POST | `/api/send-otp` | Send OTP |
| POST | `/api/verify-otp` | Verify OTP and generate JWT |
| GET | `/api/profile` | Retrieve authenticated user profile |
| POST | `/api/logout` | Logout user |

### Transaction APIs

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/transactions/deposit` | Deposit money |
| POST | `/api/transactions/withdraw` | Withdraw money |
| GET | `/api/transactions` | View transaction history |
| GET | `/api/transactions/balance` | Check account balance |

---

## Security Features

- JWT Authentication
- OTP-based Multi-Factor Authentication
- Password Hashing using bcrypt
- Protected REST APIs
- Environment Variables (.env)
- CORS Configuration
- Input Validation
- Session Management

---

## Database Collections

MongoDB stores the following collections:

- users
- otp_sessions
- transactions

---

## Why Flask?

Flask was chosen because it is lightweight, flexible, and well suited for building REST APIs. It integrates seamlessly with Python libraries and allows rapid backend development.

---

## Why MongoDB?

MongoDB was selected because it stores data as flexible JSON-like documents, making it suitable for user profiles, OTP sessions, and transaction records.

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd Cyber-Banking-Authentication-System
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

Backend runs on:

```
http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## API Testing

All APIs were tested using Postman.

The following APIs were verified:

- User Registration
- Login
- OTP Generation
- OTP Verification
- Deposit
- Withdraw
- Balance Inquiry
- Transaction History

---

## Skills Demonstrated

- Full Stack Development
- REST API Development
- React
- Flask
- MongoDB
- JWT Authentication
- OTP Authentication
- Password Hashing
- API Testing with Postman
- Authentication and Authorization

---

## Future Enhancements

- Payment Gateway Integration (Razorpay/Stripe)
- Email Notifications
- Admin Dashboard
- Role-Based Access Control (RBAC)
- PDF Account Statements
- Docker Deployment
- Cloud Deployment on AWS/Azure
