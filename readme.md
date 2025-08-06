
---

```markdown
# Account Management System (Node.js + Express + MongoDB)

This project is an **Account Management System** that handles accounts, payments, and activity logs. It provides a RESTful API with **secure CRUD operations**, activity tracking, and payment recording.

---

## Features
- Account creation, update, deletion
- Payment recording and retrieval
- Activity logging with pagination
- Bulk activity fetching
- MongoDB for data persistence
- Secure input sanitization
- Pagination for large datasets
- Dockerized deployment
- Swagger API documentation

---

## Architecture Overview

The project follows a **modular MVC pattern**:

- **Models** → Mongoose models for Accounts, Payments, and Activities
- **Controllers** → Handle API logic
- **Routes** → REST endpoints for Accounts, Payments, and Activities
- **Middleware** → Authentication, input sanitization, error handling
- **Database** → MongoDB (with Mongoose ORM)
- **Logging** → Console + error responses

**Folder Structure**
```

account-management/
├── src/
│ ├── models/
│ │ ├── Account.js
│ │ ├── Payment.js
│ │ └── Activity.js
│ ├── controllers/
│ │ ├── accountController.js
│ │ ├── paymentController.js
│ │ └── activityController.js
│ ├── routes/
│ │ ├── accountRoutes.js
│ │ ├── paymentRoutes.js
│ │ └── activityRoutes.js
│ ├── middlewares/
│ │ ├── auth.js
│ │ ├── errorHandler.js
│ │ └── sanitize.js
│ └── app.js
├── tests/
│ ├── unit/
│ └── integration/
├── docs/
│ ├── api/
│ └── diagrams/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md

````

---

## Setup and Installation Guide

### 1. Clone Repository
```bash
git clone https://github.com/your-username/account-management.git
cd account-management
````

### 2. Environment Variables

Create a `.env` file in the root directory with:

```
PORT=5000
MONGO_URI=mongodb://mongo:27017/account_management
JWT_SECRET=your_secret_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally (Without Docker)

```bash
npm run dev
```

### 5. Run with Docker

Build and start containers:

```bash
docker-compose up --build
```

This will start:

* Node.js server at `http://localhost:5000`
* MongoDB container

---

## API Documentation (Swagger)

Swagger is available at:

```
http://localhost:5000/api-docs
```

---

## API Endpoints

### **Accounts**

| Method | Endpoint            | Description       |
| ------ | ------------------- | ----------------- |
| POST   | `/api/accounts`     | Create an account |
| GET    | `/api/accounts`     | Get all accounts  |
| GET    | `/api/accounts/:id` | Get account by ID |
| PUT    | `/api/accounts/:id` | Update account    |
| DELETE | `/api/accounts/:id` | Delete account    |

**Sample Request Body (Create Account)**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "balance": 1000
}
```

---

### **Payments**

| Method | Endpoint                   | Description  |
| ------ | -------------------------- | ------------ |
| POST   | `/api/payments/:accountId` | Add payment  |
| GET    | `/api/payments/:accountId` | Get payments |

**Sample Request Body (Add Payment)**

```json
{
  "amount": 500,
  "method": "CREDIT_CARD"
}
```

---

### **Activities**

| Method | Endpoint               | Description                      |
| ------ | ---------------------- | -------------------------------- |
| POST   | `/api/activities/:id`  | Log activity for account         |
| GET    | `/api/activities/:id`  | Get activities for one account   |
| POST   | `/api/activities/bulk` | Get activities for many accounts |

**Sample Request Body (Log Activity)**

```json
{
  "type": "CREATE",
  "message": "Account created successfully"
}
```

**Sample Request Body (Bulk Activities)**

```json
{
  "accountIds": ["64a87f9e5a2d3c1234567890", "64a87f9e5a2d3c1234567891"]
}
```

---

## Performance Benchmarks

* **Average Response Time**: < 100ms for simple queries
* **Database Indexing**: Indexed on `accountId` and `timestamp` for faster activity retrieval
* **Pagination**: Implemented for activities and payments

---

## Deployment Considerations

* Use **Docker** for consistent environment
* Use **MongoDB Atlas** for cloud DB
* Set **JWT\_SECRET** as environment variable in production
* Enable **HTTPS** for secure API
* Add **Rate Limiting** for security

---


