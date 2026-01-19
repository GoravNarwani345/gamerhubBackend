# 🎮 GamerHub Frontend Integration Guide

This is the comprehensive guide for integrating your frontend application with the GamerHub backend.

## 📋 Table of Contents
1. [Authentication & Security](#1-authentication--security)
2. [REST API Reference](#2-rest-api-reference)
3. [Socket.io Real-Time Events](#3-socketio-real-time-events)
4. [React Implementation Examples](#4-react-implementation-examples)
5. [Standard Error Responses](#5-standard-error-responses)

---

## 1. Authentication & Security

### Connection Security
All protected endpoints and socket connections require a **JWT Token**.
- **Bearer Token:** For REST APIs, include `Authorization: Bearer <token>` in your headers.
- **Socket Auth:** For Socket.io, pass the token in the `auth` object during initialization.

### Rate Limiting
The API implements rate limiting (100 requests per 15 minutes). If exceeded, you will receive a `429 Too Many Requests` status.

---

## 2. REST API Reference

### 🔐 User & Auth
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Register New User (triggers OTP) | No |
| `POST` | `/api/users/login` | Login & Get JWT Token | No |
| `GET` | `/api/users/userdata` | Get Current User Data | Yes |
| `POST` | `/api/users/forgot-password` | Request Reset OTP | No |
| `POST` | `/api/users/verify-otp` | Verify Reset OTP | No |
| `POST` | `/api/users/reset-password` | Update Password | No |
| `GET` | `/api/users/:userId` | Get Public Profile by ID | No |
| `PUT` | `/api/users/me/update` | Update Own Profile | Yes |
| `POST` | `/api/users/:userId/follow` | Follow/Unfollow User | Yes |

### 📺 Streaming
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/streams/live` | List All Active Streams | No |
| `POST` | `/api/streams/create` | Initialize a Stream Session | Yes |
| `GET` | `/api/streams/:streamId` | Get Specific Stream Details | No |
| `GET` | `/api/streams/search?query=...` | Search for Streams | No |

### 📝 Social Feed (Posts)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Get All Feed Posts | No |
| `POST` | `/api/posts` | Create New Post | Yes |
| `POST` | `/api/posts/:id/like` | Like/Unlike a Post | Yes |
| `POST` | `/api/posts/:id/comment` | Add Comment to Post | Yes |

---

## 3. Socket.io Real-Time Events

### Connection Setup
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: { token: localStorage.getItem('token') },
  transports: ['websocket']
});
```

### 📡 Event Reference

#### 📹 Streaming Events
| Event (Emit) | Payload | Description |
| :--- | :--- | :--- |
| `joinStream` | `{ streamId, userId }` | Enter a stream's virtual room |
| `leaveStream` | `{ streamId, userId }` | Exit a stream's room |
| `startStream` | `{ streamId, userId, title, category }` | Broadcaster starts the stream |
| `endStream` | `{ streamId, userId }` | Broadcaster stops the stream |

| Event (Listen) | Payload | Description |
| :--- | :--- | :--- |
| `streamLive` | `{ streamId, title, streamerName, ... }` | Notification of a new live stream |
| `viewerCountUpdated`| `{ viewerCount }` | Real-time update of current viewers |
| `streamEnded` | `{ streamId, duration, totalLikes }` | Notification that stream has stopped |

#### 💬 Chat & Social Events
| Event (Emit) | Payload | Description |
| :--- | :--- | :--- |
| `sendMessage` | `{ streamId, userId, messageText }` | Send a message to stream chat |
| `likeMessage` | `{ messageId, streamId, userId }` | Like a specific chat bubble |
| `replyToMessage` | `{ messageId, streamId, userId, text }` | Reply to an existing message |

| Event (Listen) | Payload | Description |
| :--- | :--- | :--- |
| `newMessage` | `{ _id, userId, username, messageText, ... }` | Receive new chat message |
| `messageLiked` | `{ messageId, likes }` | Update like count for a message |
| `messageReply` | `{ messageId, reply: { ... } }` | Receive new reply to a message |

---

## 4. React Implementation Examples

### Custom Hook for Live Chat
```javascript
// hooks/useStreamChat.js
import { useEffect, useState, useCallback } from 'react';

export const useStreamChat = (socket, streamId, userId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket || !streamId) return;

    socket.emit('joinStream', { streamId, userId });

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit('leaveStream', { streamId, userId });
      socket.off('newMessage');
    };
  }, [socket, streamId]);

  const sendMessage = useCallback((text) => {
    socket.emit('sendMessage', { streamId, userId, messageText: text });
  }, [socket, streamId]);

  return { messages, sendMessage };
};
```

### Profile Integration (Follow/Unfollow)
```javascript
const toggleFollow = async (targetUserId) => {
  const res = await fetch(`http://localhost:8000/api/users/${targetUserId}/follow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  // returns updated followers count
};
```

---

## 5. Standard Error Responses

The backend uses consistent error messaging for both REST and Sockets.

### REST Errors
```json
{
  "success": false,
  "status": 401,
  "message": "Invalid token"
}
```

### Global Socket Error Listener
```javascript
socket.on('errorMessage', (errorText) => {
  console.error("Socket Error:", errorText);
  // Show toast notification here
});
```

---

*For backend set up and deployment, please refer to the [README.md](./README.md).*
