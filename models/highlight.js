const mongoose=require("mongoose");
const streamSchema=new mongoose.Schema({
  streamId:{type:mongoose.Schema.Types.ObjectId,ref:"Stream"},
  clipUrl: String,
  detectedAt: { type: Date, default: Date.now },
  tags: [String]
}
);
module.exports=mongoose.model("Highlight",streamSchema)