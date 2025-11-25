const mongoose = require("mongoose");
require("dotenv").config();
const dbURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gamerhub";

const connectDB = async () => {
    try {
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;