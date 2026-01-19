// socketio setup with authentication
require('dotenv').config();
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
let io;

module.exports = {
    init: (server) => {
        io = socketio(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Socket authentication middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.userId;
                    socket.authenticated = true;
                } catch (err) {
                    socket.authenticated = false;
                    socket.userId = null;
                }
            } else {
                socket.authenticated = false;
                socket.userId = null;
            }
            // Allow connection even without auth (for public viewing)
            next();
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
