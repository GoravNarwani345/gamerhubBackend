# 🎮 GamerHub Backend

Comprehensive streaming platform backend with real-time interactions, chat, and social features.

## 🚀 Features
- **Streaming:** Create, manage, and browse live streams.
- **Real-time Chat:** Interactive chat with likes, replies, and community engagement.
- **User Profiles:** Full profile management with followers, bio, and avatars.
- **Social Feed:** Post updates, media, and engage with other gamers.
- **Security:** JWT Authentication, OTP email verification, and rate limiting.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js (v5)
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.io v4
- **Auth:** JWT + Bcrypt
- **Email:** Nodemailer

---

## ⚡ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root:
```env
PORT=8000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Run the Server
```bash
# Development
nodemon server.js

# Production
node server.js
```

### 4. Seed Dummy Data
To populate the database with 3 users and 1 admin:
```bash
node seed.js
```

---

## 📁 Project Structure
```
i:\gamerhub\backend\
├── 📁 config/          # Database, Socket, Mailing configs
├── 📁 controllers/     # Business logic
├── 📁 middleware/      # Auth & Security middlewares
├── 📁 models/          # Mongoose schemas
├── 📁 routes/          # API endpoints
├── 📁 SOCKETS/         # Real-time event handlers
├── 📁 uploads/         # Static file storage
├── 📄 server.js        # Entry point
└── 📄 seed.js          # Database seeding script
```

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/users/register` - Register user (sends OTP)
- `POST /api/users/login` - User login (returns JWT)
- `POST /api/users/forgot-password` - Request reset OTP
- `POST /api/users/verify-otp` - Verify OTP
- `POST /api/users/reset-password` - Update password

### Profiles
- `GET /api/users/userdata` - Get current user info (Auth)
- `GET /api/users/:userId` - Get any user profile
- `PUT /api/users/me/update` - Update profile details (Auth)
- `POST /api/users/:userId/follow` - Follow/Unfollow user (Auth)
- `GET /api/users/trending/top-streamers` - Get popular streamers

### Streams
- `GET /api/streams/live` - List all active streams
- `POST /api/streams/create` - Initialize a stream (Auth)
- `GET /api/streams/:streamId` - Get stream details
- `GET /api/streams/search?query=...` - Search for streams

### Social (Posts)
- `GET /api/posts` - Get social feed
- `POST /api/posts` - Create new post (Auth)
- `POST /api/posts/:id/like` - Like/Unlike post (Auth)
- `POST /api/posts/:id/comment` - Add comment (Auth)

---

## 🧪 Documentation & Guides
- **Frontend Integration:** See [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) for Socket.io events and client-side examples.
