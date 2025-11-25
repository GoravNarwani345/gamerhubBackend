const mongoose=require("mongoose");
const messageSchema=new mongoose.Schema({
  streamId:{type:mongoose.Schema.Types.ObjectId,ref:"Stream"},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  messageText: String,
  timestamp: { type: Date, default: Date.now },
  isFlagged: { type: Boolean, default: false}
}
);
module.exports=mongoose.model("Message",messageSchema)
