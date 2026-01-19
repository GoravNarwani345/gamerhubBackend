require("dotenv").config({ slient: true });
require("./config/db")(); // Connect to the database
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const cors = require("cors");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chatroute");
const streamRoutes = require("./routes/streams");
const highlightRoutes = require('./routes/highlight');
const reportRoutes = require('./routes/report');
const postRoutes = require('./routes/post');
const socket = require("./config/socket");
const streamSocket = require("./SOCKETS/stream");

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

// Security Middlwares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window (increased for Dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many requests from this IP, please try again after 15 minutes" }
});

app.use("/api/", apiLimiter);
app.use('/uploads', express.static('uploads'));

// Initialize socket.io
const io = socket.init(server);
streamSocket(io);

app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/streams", streamRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/posts', postRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    status,
    message
  });
});
