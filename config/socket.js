// socketio setup
require('dotenv').config();
const socketio = require('socket.io');
let io;

module.exports = {
    init: (server) => {
        io = socketio(server, {
            cors: {
                origin: process.env.CLIENT_URL,
                methods: ["GET", "POST"]
            }
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

                