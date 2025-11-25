# Complete Integration Examples

## Frontend Implementation Examples

### 1. Socket Connection Setup

```javascript
// Initialize socket connection
const socket = io('http://localhost:8000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Global variables
let currentUserId = null;
let currentStreamId = null;
let currentToken = null;

// Check connection
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

### 2. User Authentication

```javascript
// Login and get token
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:8000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.token) {
      currentToken = data.token;
      // Decode token to get userId
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      currentUserId = payload.userId;
      return true;
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
  return false;
}

// Fetch user profile
async function getUserProfile() {
  const response = await fetch('http://localhost:8000/api/profiles/me/profile', {
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  });
  return response.json();
}
```

---

### 3. Stream Management (Streamer)

```javascript
// Create a new stream
async function createStream(title, description, category) {
  try {
    const response = await fetch('http://localhost:8000/api/streams/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        title,
        description,
        category
      })
    });
    
    const data = await response.json();
    return data.stream._id; // Return streamId
  } catch (error) {
    console.error('Failed to create stream:', error);
  }
}

// Start broadcasting
function startStreaming(streamId, title, description, category) {
  socket.emit('startStream', {
    streamId: streamId,
    userId: currentUserId,
    title: title,
    description: description,
    category: category
  });
  
  currentStreamId = streamId;
}

// Listen for stream start confirmation
socket.on('streamLive', (data) => {
  console.log(`🔴 LIVE: ${data.title} by ${data.streamerName}`);
  // Update UI to show stream is live
});

// End stream
function stopStreaming() {
  socket.emit('endStream', {
    streamId: currentStreamId,
    userId: currentUserId
  });
}

socket.on('streamEnded', (data) => {
  console.log('Stream ended');
  console.log(`Stats: ${data.totalLikes} likes, ${data.totalComments} comments`);
});
```

---

### 4. Viewing Streams

```javascript
// Get all live streams
async function getLiveStreams() {
  const response = await fetch('http://localhost:8000/api/streams/live');
  const streams = await response.json();
  
  console.log(`📺 ${streams.length} live streams`);
  streams.forEach(stream => {
    console.log(`- ${stream.title} (${stream.viewersCount} viewers)`);
  });
  
  return streams;
}

// Join a stream
function joinStream(streamId) {
  socket.emit('joinStream', {
    streamId: streamId,
    userId: currentUserId
  });
  
  currentStreamId = streamId;
}

// Listen for streamer info
socket.on('streamerProfile', (profile) => {
  console.log(`👤 Streamer: ${profile.username}`);
  console.log(`   Followers: ${profile.followers}`);
  console.log(`   Bio: ${profile.bio}`);
  
  // Display profile in UI
  displayStreamerProfile(profile);
});

// Listen for viewer count updates
socket.on('viewerCountUpdated', (data) => {
  console.log(`👥 Viewers: ${data.viewerCount}`);
  document.getElementById('viewer-count').textContent = data.viewerCount;
});

// Search streams
async function searchStreams(query) {
  const response = await fetch(
    `http://localhost:8000/api/streams/search?query=${query}`
  );
  return response.json();
}

// Get streams by category
async function getStreamsByCategory(category) {
  const response = await fetch(
    `http://localhost:8000/api/streams/category/${category}`
  );
  return response.json();
}
```

---

### 5. Chat Functionality

```javascript
// Send message
function sendMessage(messageText) {
  socket.emit('sendMessage', {
    streamId: currentStreamId,
    userId: currentUserId,
    messageText: messageText,
    username: 'your_username' // Get from profile
  });
}

// Receive messages
socket.on('newMessage', (message) => {
  console.log(`💬 ${message.username}: ${message.messageText}`);
  
  // Add to chat UI
  addMessageToChat({
    id: message._id,
    username: message.username,
    avatar: message.userAvatar,
    text: message.messageText,
    likes: message.likes,
    timestamp: message.timestamp
  });
});

// Like a message
function likeMessage(messageId) {
  socket.emit('likeMessage', {
    messageId: messageId,
    streamId: currentStreamId,
    userId: currentUserId
  });
}

// Listen for like updates
socket.on('messageLiked', (data) => {
  console.log(`❤️ Message has ${data.likes} likes`);
  updateMessageLikes(data.messageId, data.likes);
});

// Reply to message
function replyToMessage(messageId, replyText) {
  socket.emit('replyToMessage', {
    messageId: messageId,
    streamId: currentStreamId,
    userId: currentUserId,
    username: 'your_username',
    userAvatar: 'your_avatar_url',
    replyText: replyText
  });
}

// Listen for replies
socket.on('messageReply', (data) => {
  console.log(`↩️ Reply from ${data.reply.username}: ${data.reply.text}`);
  addReplyToMessage(data.messageId, data.reply);
});

// Edit message
function editMessage(messageId, newText) {
  socket.emit('updateMessage', {
    messageId: messageId,
    streamId: currentStreamId,
    messageText: newText
  });
}

// Delete message
function deleteMessage(messageId) {
  socket.emit('deleteMessage', {
    messageId: messageId,
    streamId: currentStreamId
  });
}

socket.on('messageDeleted', (data) => {
  console.log('Message deleted');
  removeMessageFromUI(data.messageId);
});
```

---

### 6. Profile System

```javascript
// Get streamer profile (for modal)
function viewStreamerProfile(streamerId) {
  socket.emit('getStreamerProfile', {
    streamerId: streamerId
  });
}

socket.on('streamerProfile', (profile) => {
  // Display profile modal
  showProfileModal({
    name: profile.username,
    avatar: profile.avatar,
    bio: profile.bio,
    followers: profile.followers,
    following: profile.following,
    isStreamer: profile.isStreamer,
    streamTitle: profile.streamTitle,
    streamCategory: profile.streamCategory,
    joinedDate: profile.joinedDate
  });
});

// Get viewer profile (for modal)
function viewViewerProfile(viewerId) {
  socket.emit('getViewerProfile', {
    viewerId: viewerId
  });
}

socket.on('viewerProfile', (profile) => {
  showProfileModal({
    name: profile.username,
    avatar: profile.avatar,
    bio: profile.bio,
    followers: profile.followers,
    joinedDate: profile.joinedDate
  });
});

// Follow a user
async function followUser(userId) {
  const response = await fetch(
    `http://localhost:8000/api/profiles/${userId}/follow`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    }
  );
  
  if (response.ok) {
    console.log('User followed!');
    updateFollowButton(true);
  }
}

// Get top streamers
async function getTopStreamers() {
  const response = await fetch(
    'http://localhost:8000/api/profiles/trending/top-streamers'
  );
  const streamers = await response.json();
  
  // Display in UI
  displayTopStreamers(streamers);
}

// Update profile
async function updateMyProfile(updates) {
  const response = await fetch(
    'http://localhost:8000/api/profiles/me/update',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(updates)
    }
  );
  
  return response.json();
}
```

---

### 7. Stream Analytics (Streamer)

```javascript
// Get stream analytics
async function getStreamAnalytics(streamId) {
  const response = await fetch(
    `http://localhost:8000/api/streams/${streamId}/analytics`,
    {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    }
  );
  
  const analytics = await response.json();
  console.log('📊 Stream Analytics:');
  console.log(`Peak Viewers: ${analytics.peakViewers}`);
  console.log(`Total Viewers: ${analytics.totalViewers}`);
  console.log(`Total Comments: ${analytics.totalComments}`);
  console.log(`Total Likes: ${analytics.totalLikes}`);
  console.log(`Duration: ${analytics.duration}ms`);
  
  return analytics;
}

// Display in dashboard
function displayAnalytics(analytics) {
  document.getElementById('peak-viewers').textContent = analytics.peakViewers;
  document.getElementById('total-viewers').textContent = analytics.totalViewers;
  document.getElementById('comments-count').textContent = analytics.totalComments;
  document.getElementById('likes-count').textContent = analytics.totalLikes;
}
```

---

### 8. HTML UI Elements

```html
<!-- Stream Container -->
<div id="stream-container">
  <!-- Video/Stream player would go here -->
  <video id="stream-video" width="100%" height="100%"></video>
  
  <!-- Viewer Count -->
  <div class="viewer-info">
    👥 <span id="viewer-count">0</span> Viewers
  </div>
  
  <!-- Streamer Info Button -->
  <button onclick="viewStreamerProfile(streamerId)">
    👤 Streamer Profile
  </button>
</div>

<!-- Chat Container -->
<div id="chat-container">
  <div id="messages-list"></div>
  
  <div class="chat-input">
    <input type="text" id="message-input" placeholder="Send a message...">
    <button onclick="sendMessage()">Send</button>
  </div>
</div>

<!-- Profile Modal -->
<div id="profile-modal" class="modal">
  <div class="modal-content">
    <span class="close" onclick="closeModal()">&times;</span>
    
    <div class="profile-header">
      <img id="profile-avatar" src="" alt="avatar">
      <h2 id="profile-name"></h2>
      <button id="follow-btn" onclick="followUser()">Follow</button>
    </div>
    
    <div class="profile-info">
      <p id="profile-bio"></p>
      <div class="followers">
        <span>Followers: <strong id="followers-count">0</strong></span>
        <span>Following: <strong id="following-count">0</strong></span>
      </div>
    </div>
    
    <div id="streamer-info" style="display:none;">
      <h3 id="stream-title"></h3>
      <p id="stream-category"></p>
    </div>
  </div>
</div>

<!-- Message Item Template -->
<template id="message-template">
  <div class="message">
    <img class="avatar" src="" alt="">
    <div class="message-content">
      <div class="message-header">
        <span class="username"></span>
        <span class="timestamp"></span>
      </div>
      <p class="text"></p>
      <div class="message-actions">
        <button class="like-btn">❤️ <span class="likes">0</span></button>
        <button class="reply-btn">↩️ Reply</button>
        <button class="delete-btn">🗑️</button>
      </div>
    </div>
  </div>
</template>
```

---

### 9. Complete Example Flow

```javascript
// 1. User logs in
await loginUser('user@example.com', 'password');

// 2. Get their profile
const profile = await getUserProfile();
console.log(`Welcome, ${profile.username}!`);

// 3. View live streams
const streams = await getLiveStreams();

// 4. Join a stream
if (streams.length > 0) {
  joinStream(streams[0]._id);
}

// 5. Send message
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage(e.target.value);
    e.target.value = '';
  }
});

// 6. Like messages
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('like-btn')) {
    const messageId = e.target.closest('.message').dataset.messageId;
    likeMessage(messageId);
  }
});

// 7. View profiles
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('username')) {
    const userId = e.target.closest('.message').dataset.userId;
    viewViewerProfile(userId);
  }
});

// 8. Leave stream
window.addEventListener('beforeunload', () => {
  socket.emit('leaveStream', {
    streamId: currentStreamId,
    userId: currentUserId
  });
});
```

---

This provides complete, production-ready examples for implementing the GamerHub streaming platform! 🎉
