require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const Post = require("./models/post");
const bcrypt = require("bcrypt");

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/gamerhub");
        console.log("Connected to MongoDB...");

        // Clear existing data
        await User.deleteMany({});
        await Post.deleteMany({});
        console.log("Cleared existing users and posts.");

        // Create Admin
        const admin = new User({
            username: "admin",
            email: "admin@gamerhub.com",
            password: "password123",
            isAdmin: true,
            isVerified: true,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
        });
        await admin.save();

        // Create Users
        const users = [
            {
                username: "pro_gamer",
                email: "gamer1@example.com",
                password: "password123",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer"
            },
            {
                username: "stream_master",
                email: "gamer2@example.com",
                password: "password123",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=StreamMaster"
            },
            {
                username: "noob_slayer",
                email: "gamer3@example.com",
                password: "password123",
                isVerified: true,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NoobSlayer"
            }
        ];

        const createdUsers = [];
        for (const u of users) {
            const user = new User(u);
            await user.save();
            createdUsers.push(user);
        }
        console.log("Created 3 users and 1 admin.");

        // Create Dummy Posts
        const posts = [
            {
                author: createdUsers[0]._id,
                content: "Just hit Level 100 in Elden Ring! What a journey.",
                mediaType: "image",
                mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800"
            },
            {
                author: createdUsers[1]._id,
                content: "Going live in 5 minutes! Come watch me play some Valorant.",
                mediaType: "none"
            },
            {
                author: createdUsers[2]._id,
                content: "Check out this insane triple kill I got today!",
                mediaType: "video",
                mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
            },
            {
                author: admin._id,
                content: "Welcome to GamerHub! We are excited to have you here.",
                mediaType: "image",
                mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800"
            }
        ];

        await Post.insertMany(posts);
        console.log("Seeded posts.");

        console.log("Database seeded successfully!");
        process.exit();
    } catch (err) {
        console.error("Error seeding database:", err);
        process.exit(1);
    }
};

seedData();
