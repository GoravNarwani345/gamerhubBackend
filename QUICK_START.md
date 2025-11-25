# 🎮 GamerHub Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd i:\gamerhub\backend
npm install
```

### 2. Configure Environment Variables
Update `.env` file with your settings:
```
PORT=8000
MONGO_URL=mongodb://127.0.0.1:27017/gamerhub
JWT_SECRET="gamerhubsecret"
CLIENT_URL=http://localhost:5713
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Start Server
```bash
nodemon server.js
```

---

## Quick API Testing

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"pass123"}'
```
**Response:** `{ token: "jwt_token" }`

### 2. Login
```bash
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### 3. Create Stream
```bash
curl -X POST http://localhost:8000/api/streams/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title":"Gaming Live","description":"Gameplay","category":"Gaming"}'
```

### 4. Get Live Streams
```bash
curl http://localhost:8000/api/streams/live
```

### 5. Get User Profile
```bash
curl http://localhost:8000/api/profiles/<userId>
```

---

## Socket.io Events (Client Side)

### Connect & Join Stream
```javascript
const socket = io('http://localhost:8000');

// When viewer joins
socket.emit('joinStream', {
  streamId: '64f5c3e5...',
  userId: '64f5c3e5...'
});

// Listen for stream info
socket.on('streamerProfile', (profile) => {
  console.log(`Watching ${profile.username}`);
});

socket.on('viewerCountUpdated', (data) => {
  console.log(`Viewers: ${data.viewerCount}`);
});
```

### Send Messages
```javascript
socket.emit('sendMessage', {
  streamId: '64f5c3e5...',
  userId: '64f5c3e5...',
  messageText: 'Great stream!',
  username: 'john'
});

socket.on('newMessage', (msg) => {
  console.log(`${msg.username}: ${msg.messageText}`);
});
```

### Like Message
```javascript
socket.emit('likeMessage', {
  messageId: '64f5c3e5...',
  streamId: '64f5c3e5...',
  userId: '64f5c3e5...'
});

socket.on('messageLiked', (data) => {
  console.log(`Message has ${data.likes} likes`);
});
```

### Reply to Message
```javascript
socket.emit('replyToMessage', {
  messageId: '64f5c3e5...',
  streamId: '64f5c3e5...',
  userId: '64f5c3e5...',
  username: 'john',
  userAvatar: 'avatar_url',
  replyText: 'Totally agree!'
});
```

### Get Profile Info
```javascript
socket.emit('getStreamerProfile', {
  streamerId: '64f5c3e5...'
});

socket.on('streamerProfile', (profile) => {
  console.log(profile);
  // {
  //   streamerId,
  //   username,
  //   avatar,
  //   bio,
  //   followers,
  //   isStreamer,
  //   streamTitle,
  //   streamCategory
  // }
});
```

---

## Streamer Workflow

### 1. Create Stream
```bash
POST /api/streams/create
Authorization: Bearer <token>
Body: { title, description, category }
```
Get: `streamId`

### 2. Start Streaming
```javascript
socket.emit('startStream', {
  streamId: 'id_from_step1',
  userId: 'your_user_id',
  title: 'Gaming Live',
  category: 'Gaming'
});
```

### 3. Viewers get notified
```javascript
socket.on('streamLive', (data) => {
  // Shows stream in live list
  console.log(`${data.streamerName} is live!`);
});
```

### 4. End Stream
```javascript
socket.emit('endStream', {
  streamId: 'your_stream_id',
  userId: 'your_user_id'
});
```

---

## Viewer Workflow

### 1. Browse Streams
```bash
GET /api/streams/live
```

### 2. Join Stream
```javascript
socket.emit('joinStream', {
  streamId: 'from_list',
  userId: 'your_user_id'
});
```

### 3. Interact (Chat, Like, Reply)
```javascript
// Send message
socket.emit('sendMessage', { ... });

// Like message
socket.emit('likeMessage', { ... });

// Reply
socket.emit('replyToMessage', { ... });
```

### 4. View Profile
```javascript
socket.emit('getStreamerProfile', {
  streamerId: 'streamer_id'
});
```

### 5. Leave Stream
```javascript
socket.emit('leaveStream', {
  streamId: 'stream_id',
  userId: 'your_user_id'
});
```

---

## Database Setup

### MongoDB Local Setup
```bash
# Download MongoDB Community Edition
# Install and start service
# Create database
mongosh
> use gamerhub
```

### Verify Connection
Server logs should show:
```
✅ Database connected
🎮 New client connected: socket_id
Server is running on port 8000
```

---

## Troubleshooting

### Port Already in Use
```bash
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

### Database Connection Failed
- Check MongoDB is running
- Verify MONGO_URL in .env
- Check network connectivity

### Socket Connection Issues
- Verify CLIENT_URL in .env
- Check CORS settings in socket.js
- Ensure client connects to correct server address

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD
- Use Gmail app password (not regular password)
- Enable "Less secure app access" for test accounts

---

## File Structure
```
backend/
├── server.js                 ← Main entry point
├── SOCKETS/
│   ├── chat.js              ← Group chat
│   └── stream.js            ← Stream events
├── routes/
│   ├── user.js              ← User routes
│   ├── streams.js           ← Stream endpoints
│   └── profile.js           ← Profile endpoints
├── controllers/
│   ├── user.js              ← User logic
│   ├── streams.js           ← Stream logic
│   └── profile.js           ← Profile logic
├── models/
│   ├── user.js
│   ├── streams.js
│   ├── messages.js
│   └── highlight.js
├── config/
│   ├── db.js
│   ├── socket.js
│   └── nodemailer.js
├── middleware/
│   └── auth.js
├── .env                      ← Configuration
└── package.json
```

---

## API Summary

### Authentication
- POST `/api/users/register` - Create account
- POST `/api/users/login` - Login
- POST `/api/users/forgot-password` - Reset password
- POST `/api/users/verify-otp` - Verify OTP
- POST `/api/users/reset-password` - New password

### Streams
- GET `/api/streams/live` - All live streams
- GET `/api/streams/:id` - Stream details
- POST `/api/streams/create` - Create stream (auth)
- GET `/api/streams/category/:cat` - By category
- GET `/api/streams/search?q=text` - Search

### Profiles
- GET `/api/profiles/:id` - User profile
- PUT `/api/profiles/me/update` - Update (auth)
- GET `/api/profiles/streamer/:id` - Streamer modal
- POST `/api/profiles/:id/follow` - Follow (auth)
- GET `/api/profiles/trending/top-streamers` - Top

---

## Socket Events Summary

### Stream
- `startStream` - Go live
- `joinStream` - Join as viewer
- `leaveStream` - Leave stream
- `endStream` - Stop broadcasting

### Chat
- `sendMessage` - Send message
- `likeMessage` - Like message
- `replyToMessage` - Reply to message
- `updateMessage` - Edit message
- `deleteMessage` - Delete message

### Profile
- `getStreamerProfile` - Get streamer info
- `getViewerProfile` - Get viewer info
- `followStreamer` - Follow user

---

## Testing with Postman

1. Create environment with variables:
   - `baseUrl` = `http://localhost:8000`
   - `token` = your jwt token

2. Register & get token
3. Create stream with token
4. Test socket events in browser console

---

**Happy Streaming! 🎬🎮**
