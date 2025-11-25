const messageModel=require("../models/messages");
const streamModel=require("../models/streams");
const userModel=require("../models/user");

const sendMessage=async(req,res)=>{
    try{
        const {streamId,userId,messageText}=req.body;
        if(!streamId || !userId || !messageText){
            return res.status(400).json({message:"All fields are required"});
        }
        const stream=await streamModel.findById(streamId);
        if(!stream){
            return res.status(404).json({message:"Stream not found"});
        }
        const user=await userModel.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const message=new messageModel({
            streamId,
            userId,
            messageText
        });
        await message.save();
        return res.status(201).json({message:"Message sent successfully",data:message});
    }catch(error){
        console.error("Error sending message:",error);
        return res.status(500).json({message:"Internal server error"});
    }
};

const getMessages=async(req,res)=>{
    try{
        const {streamId}=req.params;
        if(!streamId){
            return res.status(400).json({message:"Stream ID is required"});
        }
        const messages=await messageModel.find({streamId}).populate('userId', 'username').sort({timestamp:1});
        return res.status(200).json({messages});
    }catch(error){
        console.error("Error fetching messages:",error);
        return res.status(500).json({message:"Internal server error"});
    }
};

const updateMessage=async(req,res)=>{
    try{
        const {id}=req.params;
        const {messageText}=req.body;
        if(!messageText){
            return res.status(400).json({message:"Message text is required"});
        }
        const message=await messageModel.findByIdAndUpdate(id,{messageText},{new:true});
        if(!message){
            return res.status(404).json({message:"Message not found"});
        }
        return res.status(200).json({message:"Message updated successfully",data:message});
    }catch(error){
        console.error("Error updating message:",error);
        return res.status(500).json({message:"Internal server error"});
    }
};

const deleteMessage=async(req,res)=>{
    try{
        const {id}=req.params;
        const message=await messageModel.findByIdAndDelete(id);
        if(!message){
            return res.status(404).json({message:"Message not found"});
        }
        return res.status(200).json({message:"Message deleted successfully"});
    }catch(error){
        console.error("Error deleting message:",error);
        return res.status(500).json({message:"Internal server error"});
    }
};

module.exports={sendMessage, getMessages, updateMessage, deleteMessage};
