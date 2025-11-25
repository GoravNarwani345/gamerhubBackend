module.exports = (io) => {
  const Message = require("../models/messages");
  const Stream = require("../models/streams");
  const User = require("../models/user");
  const Highlight = require('../models/highlight');

  // Store active streams and viewers
  const activeStreams = new Map();
  const streamViewers = new Map();

  io.on("connection", (socket) => {
    console.log("🎮 New client connected: " + socket.id);

    // ======================== STREAM EVENTS ========================

    // Streamer starts a live stream
    socket.on("startStream", async ({ streamId, userId, title, description, category }) => {
      try {
        const stream = await Stream.findByIdAndUpdate(
          streamId,
          {
            status: "live",
            isActive: true,
            title,
            description,
            category,
            startedAt: new Date(),
            viewersCount: 0
          },
          { new: true }
        ).populate("userId", "username avatar");

        if (!stream) {
          return socket.emit("errorMessage", "Stream not found");
        }

        activeStreams.set(streamId, {
          streamerId: userId,
          startTime: new Date(),
          viewerCount: 0
        });

        // Notify all users that a stream went live
        io.emit("streamLive", {
          streamId: stream._id,
          streamerName: stream.userId.username,
          streamerAvatar: stream.userId.avatar,
          title: stream.title,
          category: stream.category,
          thumbnail: stream.thumbnail
        });

        console.log(`✅ Stream ${streamId} started by ${userId}`);
      } catch (error) {
        console.error("Error starting stream:", error);
        socket.emit("errorMessage", "Failed to start stream");
      }
    });

      // Streamer publishes video segments / stream URL
      // Clients should handle `streamVideo` to display/update the current video source
      socket.on('publishStreamVideo', async ({ streamId, userId, videoUrl, metadata }) => {
        try {
          if (!streamId || !userId || !videoUrl) {
            return socket.emit('errorMessage', 'streamId, userId and videoUrl are required');
          }

          const stream = await Stream.findById(streamId);
          if (!stream) return socket.emit('errorMessage', 'Stream not found');

          // Broadcast video info to all viewers in the room
          io.to(streamId).emit('streamVideo', {
            streamId,
            videoUrl,
            metadata: metadata || null,
            timestamp: Date.now()
          });

          // Optionally update stream thumbnail if provided in metadata
          if (metadata && metadata.thumbnail) {
            stream.thumbnail = metadata.thumbnail;
            await stream.save();
          }
        } catch (err) {
          console.error('Error publishing stream video:', err);
          socket.emit('errorMessage', 'Failed to publish stream video');
        }
      });

    // Viewer joins a stream
    socket.on("joinStream", async ({ streamId, userId }) => {
      try {
        const stream = await Stream.findById(streamId).populate("userId", "username avatar bio followers");

        if (!stream) {
          return socket.emit("errorMessage", "Stream not found");
        }

        // Join socket room for this stream
        socket.join(streamId);

        // Add viewer to stream
        if (!stream.viewers.includes(userId)) {
          stream.viewers.push(userId);
          stream.viewersCount = stream.viewers.length;
          await stream.save();
        }

        // Track viewer
        if (!streamViewers.has(streamId)) {
          streamViewers.set(streamId, new Set());
        }
        streamViewers.get(streamId).add(userId);

        // Send streamer profile info to viewer
        io.to(socket.id).emit("streamerProfile", {
          streamerId: stream.userId._id,
          streamerName: stream.userId.username,
          streamerAvatar: stream.userId.avatar,
          streamerBio: stream.userId.bio,
          followers: stream.userId.followers,
          isStreamer: stream.userId.isStreamer
        });

        // Notify all viewers of viewer count update
        io.to(streamId).emit("viewerCountUpdated", {
          viewerCount: stream.viewersCount,
          totalLikes: stream.totalLikes,
          totalComments: stream.totalComments
        });

        console.log(`👁️ User ${userId} joined stream ${streamId}. Viewers: ${stream.viewersCount}`);
      } catch (error) {
        console.error("Error joining stream:", error);
        socket.emit("errorMessage", "Failed to join stream");
      }
    });

    // Viewer leaves stream
    socket.on("leaveStream", async ({ streamId, userId }) => {
      try {
        socket.leave(streamId);

        const stream = await Stream.findById(streamId);
        if (stream) {
          stream.viewers = stream.viewers.filter(v => v.toString() !== userId);
          stream.viewersCount = stream.viewers.length;
          await stream.save();

          // Update viewer tracking
          const viewers = streamViewers.get(streamId);
          if (viewers) {
            viewers.delete(userId);
            if (viewers.size === 0) {
              streamViewers.delete(streamId);
            }
          }

          // Notify all viewers
          io.to(streamId).emit("viewerCountUpdated", {
            viewerCount: stream.viewersCount
          });
        }

        console.log(`👋 User ${userId} left stream ${streamId}`);
      } catch (error) {
        console.error("Error leaving stream:", error);
      }
    });

    // Streamer ends stream
    socket.on("endStream", async ({ streamId, userId }) => {
      try {
        const stream = await Stream.findByIdAndUpdate(
          streamId,
          {
            status: "offline",
            isActive: false,
            endedAt: new Date(),
            viewers: [],
            viewersCount: 0
          },
          { new: true }
        );

        if (!stream) {
          return socket.emit("errorMessage", "Stream not found");
        }

        activeStreams.delete(streamId);
        streamViewers.delete(streamId);

        // Notify all viewers that stream ended
        io.to(streamId).emit("streamEnded", {
          streamId,
          message: "Stream has ended",
          totalLikes: stream.totalLikes,
          totalComments: stream.totalComments,
          duration: stream.endedAt - stream.startedAt
        });

        // Disconnect all clients from stream room
        io.to(streamId).socketsLeave(streamId);

        console.log(`🛑 Stream ${streamId} ended`);
      } catch (error) {
        console.error("Error ending stream:", error);
        socket.emit("errorMessage", "Failed to end stream");
      }
    });

    // ======================== CHAT EVENTS ========================

    // Send message in stream chat
    socket.on("sendMessage", async ({ streamId, userId, messageText, username }) => {
      try {
        if (!streamId || !userId || !messageText) {
          return socket.emit("errorMessage", "All fields are required");
        }

        const stream = await Stream.findById(streamId);
        if (!stream) {
          return socket.emit("errorMessage", "Stream not found");
        }

        const user = await User.findById(userId);
        if (!user) {
          return socket.emit("errorMessage", "User not found");
        }

        const message = new Message({
          streamId,
          userId,
          messageText
        });
        await message.save();

        stream.totalComments += 1;
        await stream.save();

        io.to(streamId).emit("newMessage", {
          _id: message._id,
          streamId,
          userId,
          username: user.username,
          userAvatar: user.avatar,
          messageText,
          likes: 0,
          replies: [],
          timestamp: message.timestamp
        });

        console.log(`💬 Message in stream ${streamId}: ${messageText}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("errorMessage", "Internal server error");
      }
    });

    // Like a message
    socket.on("likeMessage", async ({ messageId, streamId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit("errorMessage", "Message not found");
        }

        // Check if user already liked
        if (!message.likedBy.includes(userId)) {
          message.likedBy.push(userId);
          message.likes += 1;
          await message.save();

          io.to(streamId).emit("messageLiked", {
            messageId,
            likes: message.likes
          });
        }

        console.log(`❤️ Message ${messageId} liked`);
      } catch (error) {
        console.error("Error liking message:", error);
        socket.emit("errorMessage", "Failed to like message");
      }
    });

    // Reply to a message
    socket.on("replyToMessage", async ({ messageId, streamId, userId, username, replyText, userAvatar }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit("errorMessage", "Message not found");
        }

        const reply = {
          userId,
          text: replyText,
          timestamp: new Date()
        };

        message.replies.push(reply);
        await message.save();

        io.to(streamId).emit("messageReply", {
          messageId,
          reply: {
            userId,
            username,
            userAvatar,
            text: replyText,
            timestamp: reply.timestamp
          }
        });

        console.log(`↩️ Reply added to message ${messageId}`);
      } catch (error) {
        console.error("Error replying to message:", error);
        socket.emit("errorMessage", "Failed to reply");
      }
    });

      // Save a highlight clip (can be emitted by server-side AI or streamer client)
      socket.on('saveHighlight', async ({ streamId, streamerId, clipUrl, thumbnail, duration, tags, generatedBy }) => {
        try {
          if (!streamId || !streamerId || !clipUrl) {
            return socket.emit('errorMessage', 'streamId, streamerId and clipUrl required');
          }

          const hl = new Highlight({ streamId, streamerId, clipUrl, thumbnail, duration, tags, generatedBy: generatedBy || 'ai' });
          await hl.save();

          // Notify room and sender
          io.to(streamId).emit('highlightSaved', {
            highlightId: hl._id,
            clipUrl: hl.clipUrl,
            thumbnail: hl.thumbnail,
            duration: hl.duration,
            createdAt: hl.createdAt
          });

          socket.emit('highlightAck', { highlightId: hl._id });
        } catch (err) {
          console.error('Error saving highlight:', err);
          socket.emit('errorMessage', 'Failed to save highlight');
        }
      });

    // Update message
    socket.on("updateMessage", async ({ messageId, streamId, messageText }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { messageText },
          { new: true }
        );

        if (!message) {
          return socket.emit("errorMessage", "Message not found");
        }

        io.to(streamId).emit("messageUpdated", {
          messageId,
          messageText
        });

        console.log(`✏️ Message ${messageId} updated`);
      } catch (error) {
        console.error("Error updating message:", error);
        socket.emit("errorMessage", "Failed to update message");
      }
    });

    // Delete message
    socket.on("deleteMessage", async ({ messageId, streamId }) => {
      try {
        const message = await Message.findByIdAndDelete(messageId);
        if (!message) {
          return socket.emit("errorMessage", "Message not found");
        }

        io.to(streamId).emit("messageDeleted", {
          messageId
        });

        console.log(`🗑️ Message ${messageId} deleted`);
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("errorMessage", "Failed to delete message");
      }
    });

    // ======================== PROFILE EVENTS ========================

    // Get streamer profile info
    socket.on("getStreamerProfile", async ({ streamerId }) => {
      try {
        const user = await User.findById(streamerId).select(
          "username avatar bio followers following isStreamer streamTitle streamCategory"
        );

        if (!user) {
          return socket.emit("errorMessage", "Streamer not found");
        }

        socket.emit("streamerProfile", {
          streamerId: user._id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
          isStreamer: user.isStreamer,
          streamTitle: user.streamTitle,
          streamCategory: user.streamCategory
        });

        console.log(`👤 Profile requested for streamer ${streamerId}`);
      } catch (error) {
        console.error("Error fetching streamer profile:", error);
        socket.emit("errorMessage", "Failed to fetch profile");
      }
    });

    // Get viewer/user profile
    socket.on("getViewerProfile", async ({ viewerId }) => {
      try {
        const user = await User.findById(viewerId).select(
          "username avatar bio followers following createdAt"
        );

        if (!user) {
          return socket.emit("errorMessage", "User not found");
        }

        socket.emit("viewerProfile", {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
          joinedDate: user.createdAt
        });

        console.log(`👤 Profile requested for viewer ${viewerId}`);
      } catch (error) {
        console.error("Error fetching viewer profile:", error);
        socket.emit("errorMessage", "Failed to fetch profile");
      }
    });

    // Follow streamer
    socket.on("followStreamer", async ({ streamerId, userId }) => {
      try {
        const streamer = await User.findById(streamerId);
        if (!streamer) {
          return socket.emit("errorMessage", "Streamer not found");
        }

        streamer.followers += 1;
        await streamer.save();

        io.emit("streamerFollowed", {
          streamerId,
          followers: streamer.followers
        });

        console.log(`⭐ Streamer ${streamerId} followed by ${userId}`);
      } catch (error) {
        console.error("Error following streamer:", error);
        socket.emit("errorMessage", "Failed to follow");
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected: " + socket.id);
    });
  });
};
