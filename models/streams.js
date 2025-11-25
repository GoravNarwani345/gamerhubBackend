const mongoose=require("mongoose");
const streamSchema=new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  title: String,
  description: String,
  category: { type: String, default: 'Gaming' },
  thumbnail: { type: String, default: null },
  status: { type: String, enum: ['live', 'offline'], default: 'offline' },
  viewersCount: { type: Number, default: 0 },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  totalLikes: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
);
module.exports=mongoose.model("Stream",streamSchema)