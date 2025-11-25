const mongoose=require("mongoose");
const streamSchema=new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  title: String,
  description: String,
  status: { type: String, enum: ['live', 'offline'], default: 'offline' },
  viewersCount: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: Date.now }
}
);
module.exports=mongoose.model("Stream",streamSchema)