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
