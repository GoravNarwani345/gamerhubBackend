module.exports = (io) => {
  const Message = require("../models/messages");
  const Stream = require("../models/streams");
  const User = require("../models/user");

  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    socket.on("joinStream", (streamId) => {
      socket.join(streamId);
      console.log(`Socket ${socket.id} joined stream ${streamId}`);
    });

    socket.on("sendMessage", async ({ streamId, userId, messageText }) => {
      try {
        if (!streamId || !userId || !messageText) {
          socket.emit("errorMessage", "All fields are required");
          return;
        }
        const stream = await Stream.findById(streamId);
        if (!stream) {
          socket.emit("errorMessage", "Stream not found");
          return;
        }
        const user = await User.findById(userId);
        if (!user) {
          socket.emit("errorMessage", "User not found");
          return;
        }
        const message = new Message({
          streamId,
          userId,
          messageText,
        });
        await message.save();

        io.to(streamId).emit("newMessage", {
          _id: message._id,
          streamId,
          userId,
          messageText,
          timestamp: message.timestamp,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("errorMessage", "Internal server error");
      }
    });

    socket.on("updateMessage", async ({ id, messageText }) => {
      try {
        if (!id || !messageText) {
          socket.emit("errorMessage", "ID and message text are required");
          return;
        }
        const message = await Message.findByIdAndUpdate(id, { messageText }, { new: true });
        if (!message) {
          socket.emit("errorMessage", "Message not found");
          return;
        }
        io.to(message.streamId.toString()).emit("messageUpdated", {
          _id: message._id,
          messageText: message.messageText,
        });
      } catch (error) {
        console.error("Error updating message:", error);
        socket.emit("errorMessage", "Internal server error");
      }
    });

    socket.on("deleteMessage", async ({ id }) => {
      try {
        if (!id) {
          socket.emit("errorMessage", "ID is required");
          return;
        }
        const message = await Message.findByIdAndDelete(id);
        if (!message) {
          socket.emit("errorMessage", "Message not found");
          return;
        }
        io.to(message.streamId.toString()).emit("messageDeleted", {
          _id: id,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("errorMessage", "Internal server error");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: " + socket.id);
    });
  });
};
