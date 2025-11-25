const mongoose=require("mongoose");
const messageSchema=new mongoose.Schema({
  streamId:{type:mongoose.Schema.Types.ObjectId,ref:"Stream"},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  messageText: String,
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  replies: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now },
  isFlagged: { type: Boolean, default: false}
}
);
module.exports=mongoose.model("Message",messageSchema)
