const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
   username: { type: String, unique: true },
   email: { type: String,  unique: true },
   password: { type: String, required: true },
   otp: { type: String },
   otpExpiry: { type: Date },
   isVerified: { type: Boolean, default: false },
   googleId: { type: String },
   accesToken: { type: String },
   refreshToken: { type: String },
   followers: { type: Number, default: 0 },
   following: { type: Number, default: 0 },
   isStreamer: { type: Boolean, default: false },
   streamTitle: { type: String, default: '' },
   streamCategory: { type: String, default: '' },
   location: { type: String, default: '' },
   bio: { type: String, default: '' },
   avatar: { type: String, default: '' },
   favoriteGames: { type: [String], default: [] },
   socials: { type: Object, default: {} },
   badges: { type: [String], default: [] },
   featuredVideoUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model("User", userSchema);
