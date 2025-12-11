# GamerHub API Documentation

## Overview
This API provides endpoints for user authentication, profile management, streaming, chat functionality, and highlights management for the GamerHub platform.

## Base URL
```
http://localhost:8000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/users/register`

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (201):**
```json
{
  "msg": "User registered successfully. OTP sent to email",
  "token": "jwt_token_string",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400`: User already exists
- `500`: Failed to send OTP email / Server error

### 2. Login User
**POST** `/users/login`

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_string"
}
```

**Error Responses:**
- `400`: Invalid credentials
- `500`: Server error

### 3. Get User Profile
**GET** `/users/userdata`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "userId": "string",
  "username": "string",
  "email": "string",
  "followers": 0,
  "following": 0,
  "isStreamer": false,
  "streamTitle": "string",
  "streamCategory": "string",
  "location": "string",
  "isVerified": false,
  "createdAt": "date"
}
```

**Error Responses:**
- `401`: Token is not valid
- `404`: User not found
- `500`: Server error

### 4. Forgot Password
**POST** `/users/forgot-password`

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response (200):**
```json
{
  "msg": "OTP sent to email successfully",
  "email": "user@example.com"
}
```

**Error Responses:**
- `404`: User not found
- `500`: Failed to send OTP email / Server error

### 5. Verify OTP
**POST** `/users/verify-otp`

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required)"
}
```

**Response (200):**
```json
{
  "msg": "OTP verified successfully",
  "resetToken": "jwt_reset_token",
  "userId": "string"
}
```

**Error Responses:**
- `400`: Invalid OTP / OTP has expired
- `404`: User not found
- `500`: Server error

### 6. Reset Password
**POST** `/users/reset-password`

**Request Body:**
```json
{
  "resetToken": "string (required)",
  "newPassword": "string (required)"
}
```

**Response (200):**
```json
{
  "msg": "Password reset successfully"
}
```

**Error Responses:**
- `400`: Reset token has expired
- `404`: User not found
- `500`: Server error

---

## 📺 Streams Endpoints

### 1. Get Live Streams
**GET** `/streams/live`

**Response (200):**
```json
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "streamer": {
      "username": "string",
      "avatar": "string",
      "bio": "string",
      "followers": 0
    },
    "viewers": 0,
    "startedAt": "date"
  }
]
```

**Error Responses:**
- `500`: Server error

### 2. Get Stream by ID
**GET** `/streams/:streamId`

**URL Parameters:**
- `streamId` (string): Stream ID

**Response (200):**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "streamer": {
    "username": "string",
    "avatar": "string",
    "bio": "string",
    "followers": 0,
    "isStreamer": true
  },
  "viewers": ["user_objects"],
  "status": "live|ended",
  "startedAt": "date"
}
```

**Error Responses:**
- `404`: Stream not found
- `500`: Server error

### 3. Create Stream
**POST** `/streams/create`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "category": "string (optional)"
}
```

**Response (201):**
```json
{
  "msg": "Stream created successfully",
  "stream": {
    "title": "string",
    "description": "string",
    "category": "string",
    "streamer": {
      "username": "string",
      "avatar": "string"
    }
  }
}
```

**Error Responses:**
- `401`: No token provided
- `404`: User not found
- `500`: Server error

### 4. Get User Streams
**GET** `/streams/user/streams`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "viewers": 0,
    "startedAt": "date",
    "status": "live|ended"
  }
]
```

**Error Responses:**
- `401`: No token provided
- `500`: Server error

### 5. Update Stream
**PUT** `/streams/:streamId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `streamId` (string): Stream ID

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "category": "string (optional)",
  "thumbnail": "string (optional)"
}
```

**Response (200):**
```json
{
  "msg": "Stream updated successfully",
  "stream": { /* updated stream object */ }
}
```

**Error Responses:**
- `401`: No token provided
- `403`: Unauthorized
- `404`: Stream not found
- `500`: Server error

### 6. Get Stream Analytics
**GET** `/streams/:streamId/analytics`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `streamId` (string): Stream ID

**Response (200):**
```json
{
  "streamId": "string",
  "title": "string",
  "peakViewers": 0,
  "totalViewers": 0,
  "totalComments": 0,
  "totalLikes": 0,
  "duration": 0
}
```

**Error Responses:**
- `401`: No token provided
- `403`: Unauthorized
- `404`: Stream not found
- `500`: Server error

### 7. Get Streams by Category
**GET** `/streams/category/:category`

**URL Parameters:**
- `category` (string): Category name

**Response (200):**
```json
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "streamer": {
      "username": "string",
      "avatar": "string",
      "bio": "string",
      "followers": 0
    },
    "viewers": 0
  }
]
```

**Error Responses:**
- `500`: Server error

### 8. Search Streams
**GET** `/streams/search`

**Query Parameters:**
- `query` (string): Search term

**Response (200):**
```json
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "streamer": {
      "username": "string",
      "avatar": "string",
      "bio": "string",
      "followers": 0
    },
    "viewers": 0
  }
]
```

**Error Responses:**
- `500`: Server error

---

## 💬 Chat Endpoints

### 1. Send Message
**POST** `/chat/send`

**Request Body:**
```json
{
  "streamId": "string (required)",
  "message": "string (required)",
  "userId": "string (required)"
}
```

**Response (200):**
```json
{
  "msg": "Message sent successfully",
  "message": {
    "id": "string",
    "message": "string",
    "userId": "string",
    "username": "string",
    "timestamp": "date"
  }
}
```

**Error Responses:**
- `500`: Server error

### 2. Get Messages
**GET** `/chat/:streamId`

**URL Parameters:**
- `streamId` (string): Stream ID

**Response (200):**
```json
[
  {
    "id": "string",
    "message": "string",
    "userId": "string",
    "username": "string",
    "timestamp": "date",
    "likes": 0
  }
]
```

**Error Responses:**
- `500`: Server error

### 3. Update Message
**PUT** `/chat/:id`

**URL Parameters:**
- `id` (string): Message ID

**Request Body:**
```json
{
  "message": "string (required)"
}
```

**Response (200):**
```json
{
  "msg": "Message updated successfully",
  "message": { /* updated message object */ }
}
```

**Error Responses:**
- `500`: Server error

### 4. Delete Message
**DELETE** `/chat/:id`

**URL Parameters:**
- `id` (string): Message ID

**Response (200):**
```json
{
  "msg": "Message deleted successfully"
}
```

**Error Responses:**
- `500`: Server error

---

## ⭐ Highlights Endpoints

### 1. Create Highlight
**POST** `/highlights/`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "streamId": "string (required)",
  "title": "string (required)",
  "description": "string (optional)",
  "timestamp": "number (optional)"
}
```

**Response (201):**
```json
{
  "msg": "Highlight created successfully",
  "highlight": {
    "id": "string",
    "title": "string",
    "description": "string",
    "streamId": "string",
    "timestamp": "number",
    "createdAt": "date"
  }
}
```

**Error Responses:**
- `500`: Server error

### 2. Get Highlights by Stream
**GET** `/highlights/stream/:streamId`

**URL Parameters:**
- `streamId` (string): Stream ID

**Response (200):**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "timestamp": "number",
    "createdAt": "date"
  }
]
```

**Error Responses:**
- `500`: Server error

### 3. Get Highlights by Streamer
**GET** `/highlights/streamer/:streamerId`

**URL Parameters:**
- `streamerId` (string): Streamer ID

**Response (200):**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "streamId": "string",
    "timestamp": "number",
    "createdAt": "date"
  }
]
```

**Error Responses:**
- `500`: Server error

---

## 🔒 Authentication Notes

- **JWT tokens expire after 1 hour**
- **Password reset tokens expire after 15 minutes**
- **OTP codes expire after 10 minutes**
- **Protected endpoints require `Authorization: Bearer <jwt_token>` header**

## 📊 Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

## 🚨 Common Error Response Format

```json
{
  "msg": "Error message description"
}
```

---

## 📝 Notes

- All endpoints use JSON for request/response bodies
- File uploads use multipart/form-data
- Timestamps are in ISO 8601 format
- User IDs are MongoDB ObjectIds
- Passwords are hashed using bcrypt
- OTP emails are sent via nodemailer configuration
