require("dotenv").config({slient: true});
require("./config/db")(); // Connect to the database
const express = require("express");
const http = require("http");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chatroute");
const socket = require("./config/socket");
const chatSocket = require("./SOCKETS/chat");

const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = socket.init(server);
chatSocket(io);

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
