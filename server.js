require("dotenv").config({slient: true});
require("./config/db")(); // Connect to the database
const express = require("express");
const http = require("http");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chatroute");
const streamRoutes = require("./routes/streams");
const profileRoutes = require("./routes/profile");
const highlightRoutes = require('./routes/highlight');
const profileModalRoutes = require('./routes/profileModal');
const socket = require("./config/socket");
const chatSocket = require("./SOCKETS/chat");
const streamSocket = require("./SOCKETS/stream");

const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = socket.init(server);
chatSocket(io);
streamSocket(io);

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/profiles", profileRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/profile-modals', profileModalRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
