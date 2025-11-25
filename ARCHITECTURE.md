# GamerHub Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                       │
│  (Web/Mobile - Browser or App)                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    REST API      Socket.io         WebRTC
   Endpoints      (Real-time)      (Video)
        │               │               │
┌───────┴────────┬──────┴──────────┬───┴──────────────────────┐
│                │                 │                           │
v                v                 v                           v
┌──────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                              │
│ (Node.js + Express + Socket.io)                               │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │   ROUTES        │  │   CONTROLLERS    │  │  SOCKETS   │  │
│  │                 │  │                  │  │            │  │
│  │ /api/users      │  │ user.js          │  │ stream.js  │  │
│  │ /api/streams    │  │ streams.js       │  │ chat.js    │  │
│  │ /api/profiles   │  │ profile.js       │  │            │  │
│  │ /api/chat       │  │ chat.js (exist)  │  │            │  │
│  └─────────────────┘  └──────────────────┘  └────────────┘  │
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │   MIDDLEWARE         │  │   CONFIG                     │  │
│  │                      │  │                              │  │
│  │ auth.js (JWT verify) │  │ socket.js (initialization)   │  │
│  │                      │  │ db.js (MongoDB connect)      │  │
│  │                      │  │ nodemailer.js (email)        │  │
│  └──────────────────────┘  └──────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                        │
                        │
┌───────────────────────┼────────────────────────────────────┐
│                       │                                     │
v                       v                                     v
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   MONGODB        │  │   NODEMAILER     │  │  JWT AUTH    │
│                  │  │                  │  │              │
│  Collections:    │  │  - Gmail SMTP    │  │  - Tokens    │
│  - users         │  │  - Email sending │  │  - Secrets   │
│  - streams       │  │  - OTP emails    │  │  - Verify    │
│  - messages      │  │                  │  │              │
│  - chats (exist) │  └──────────────────┘  └──────────────┘
└──────────────────┘
```

---

## Data Flow Diagram

### User Registration & Verification
```
┌─────────────┐
│  User Reg   │
└──────┬──────┘
       │
       v
  POST /api/users/register
       │
       v
  ┌─────────────────────┐
  │ Check user exists   │
  │ Hash password       │
  │ Create in DB        │
  │ Generate OTP        │
  └──────┬──────────────┘
         │
         v
  Nodemailer sends email
         │
         v
  ┌──────────────────────┐
  │ User receives OTP    │
  │ in email inbox       │
  └──────────────────────┘
```

### Stream Lifecycle
```
┌──────────────────────────────────────────────────────────────┐
│                    STREAM CREATION                            │
└──────┬───────────────────────────────────────────────────────┘
       │
       v
   POST /api/streams/create
   (with JWT token & stream info)
       │
       v
   ┌──────────────────────────────┐
   │ Create stream document       │
   │ status: "offline"            │
   │ isActive: false              │
   │ viewers: []                  │
   └──────────────┬───────────────┘
                  │
                  v
       Return streamId to user
                  │
                  v
   ┌──────────────────────────────────────────────────────────┐
   │              GOING LIVE (Socket Event)                   │
   └──────┬────────────────────────────────────────────────────┘
          │
          v
   Socket: startStream
   {streamId, userId, title, category}
          │
          v
   ┌──────────────────────────────────────┐
   │ Update stream in DB:                 │
   │ status: "live"                       │
   │ isActive: true                       │
   │ startedAt: now                       │
   │ viewersCount: 0                      │
   └──────┬───────────────────────────────┘
          │
          v
   Emit 'streamLive' to all clients
   (Shows in live streams list)
          │
          v
   ┌──────────────────────────────────────────────────────────┐
   │                VIEWERS JOINING                            │
   └──────┬────────────────────────────────────────────────────┘
          │
          v
   Socket: joinStream
   {streamId, userId}
          │
          v
   ┌──────────────────────────────────────┐
   │ Add userId to stream.viewers array   │
   │ Increment viewersCount               │
   │ Save to DB                           │
   │ Join socket room: streamId           │
   └──────┬───────────────────────────────┘
          │
          v
   Emit 'streamerProfile' to joining user
   Emit 'viewerCountUpdated' to all in room
          │
          v
   ┌──────────────────────────────────────────────────────────┐
   │            LIVE INTERACTION (Chat & Comments)            │
   └──────┬────────────────────────────────────────────────────┘
          │
          v
    Socket: sendMessage
    {streamId, userId, messageText}
          │
          v
    ┌──────────────────────────┐
    │ Create message document: │
    │ - userId                 │
    │ - messageText            │
    │ - streamId               │
    │ - timestamp              │
    │ - likes: 0               │
    └──────┬───────────────────┘
           │
           v
    Save to DB
           │
           v
    Emit 'newMessage' to all
    viewers in stream room
           │
           v
    ┌──────────────────────────────────────────────────────────┐
    │            MESSAGE INTERACTIONS                           │
    └──────┬────────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
    v                     v
Socket: likeMessage   Socket: replyToMessage
{messageId, userId}   {messageId, userId, replyText}
    │                     │
    v                     v
Update message        Add reply to message
likes counter         in replies array
    │                     │
    v                     v
    └──────────┬──────────┘
               v
    Emit update to room
               │
               v
    ┌──────────────────────────────────────────────────────────┐
    │                 STREAM ENDING                             │
    └──────┬────────────────────────────────────────────────────┘
           │
           v
    Socket: endStream
    {streamId, userId}
           │
           v
    ┌──────────────────────────────────────┐
    │ Update stream in DB:                 │
    │ status: "offline"                    │
    │ isActive: false                      │
    │ endedAt: now                         │
    │ viewers: []                          │
    │ viewersCount: 0                      │
    └──────┬───────────────────────────────┘
           │
           v
    Emit 'streamEnded' to all viewers
    with final statistics
           │
           v
    Disconnect all from stream room
```

---

## Profile Modal Flow

```
User clicks on username in chat
           │
           v
Socket: getStreamerProfile
{streamerId}
           │
           v
    Fetch from DB:
    - username
    - avatar
    - bio
    - followers
    - isStreamer
    - streamTitle
    - streamCategory
           │
           v
    Emit 'streamerProfile' event
           │
           v
    Frontend shows profile modal:
    ┌─────────────────────────────────┐
    │ Avatar                          │
    │ Username                        │
    │ [Follow] button                 │
    │ Bio/Description                 │
    │ Followers count                 │
    │ Stream Info (if streamer)       │
    └─────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌────────────────────────────────────┐
│          USER                       │
├────────────────────────────────────┤
│ _id                                 │
│ username                            │
│ email                               │
│ password                            │
│ avatar                              │
│ bio                                 │
│ followers (count)                   │
│ following (count)                   │
│ isStreamer                          │
│ streamTitle                         │
│ streamCategory                      │
│ createdAt                           │
└─────────┬───────────────────────────┘
          │
          │ userId
          │
          v
┌────────────────────────────────────┐
│          STREAM                     │
├────────────────────────────────────┤
│ _id                                 │
│ userId (ref: User)                  │
│ title                               │
│ description                         │
│ category                            │
│ thumbnail                           │
│ status (live/offline)               │
│ viewersCount                        │
│ viewers [] (ref: User)              │
│ totalLikes                          │
│ totalComments                       │
│ startedAt                           │
│ endedAt                             │
│ isActive                            │
│ createdAt                           │
└─────────┬───────────────────────────┘
          │
          │ streamId
          │
          v
┌────────────────────────────────────┐
│          MESSAGE                    │
├────────────────────────────────────┤
│ _id                                 │
│ streamId (ref: Stream)              │
│ userId (ref: User)                  │
│ messageText                         │
│ likes (count)                       │
│ likedBy [] (ref: User)              │
│ replies [{                          │
│   userId (ref: User)                │
│   text                              │
│   timestamp                         │
│ }]                                  │
│ timestamp                           │
│ isFlagged                           │
└────────────────────────────────────┘
```

---

## Real-time Event Flow

```
CLIENT 1 (Streamer)              SOCKET.IO              CLIENT 2 (Viewer)
                                                                  
    emit('startStream')  ────────────────────>  Server processes
                                                ├─ Updates DB
                                                ├─ Stores in memory
                                                └─ Broadcasts to all
                                                    
                            <─ streamLive ────── Receives notification
                                                 └─ Shows in live list
                                                
                                                    emit('joinStream')
                                              ──────────────────>
                                               Server processes
                                               ├─ Adds to viewers
                                               ├─ Joins socket room
                                               └─ Sends streamer profile
                                               
                            <─ streamerProfile ── Receives profile
                                                  └─ Shows in modal
                                                  
    emit('sendMessage')  ────────────────────>  Server saves to DB
                                                ├─ Broadcasts to room
                                                
                            <─ newMessage ────── Receives message
                                                └─ Shows in chat
                                                
                                               emit('likeMessage')
                                              ──────────────────>
                                               Server updates DB
                                               ├─ Increments counter
                                               └─ Broadcasts update
                                               
                            <─ messageLiked ──── Receives update
                                                └─ Updates likes count
                                                
    emit('endStream')    ────────────────────>  Server processes
                                                ├─ Sets offline
                                                ├─ Collects stats
                                                └─ Broadcasts to room
                                                
                            <─ streamEnded ───── Receives end event
                                                └─ Shows stats & closes
```

---

## State Management (Server-Side)

```
┌───────────────────────────────────────────┐
│   ACTIVE STREAMS (In-Memory Map)          │
├───────────────────────────────────────────┤
│ streamId1 → {                             │
│   streamerId: userId,                     │
│   startTime: Date,                        │
│   viewerCount: 42                         │
│ }                                         │
│                                           │
│ streamId2 → { ... }                       │
│ ...                                       │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│   STREAM VIEWERS (In-Memory Map)          │
├───────────────────────────────────────────┤
│ streamId1 → Set[                          │
│   userId1,                                │
│   userId2,                                │
│   userId3,                                │
│   ...                                     │
│ ]                                         │
│                                           │
│ streamId2 → Set[ ... ]                    │
│ ...                                       │
└───────────────────────────────────────────┘
```

---

This architecture ensures:
- **Scalability**: Handles multiple concurrent streams and viewers
- **Real-time**: Instant updates via Socket.io
- **Persistence**: All data saved to MongoDB
- **Security**: JWT authentication on protected endpoints
- **Reliability**: Error handling and validation throughout
