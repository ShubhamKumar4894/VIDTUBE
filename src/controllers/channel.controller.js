import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/users.models.js"
import { Channel } from "../models/channel.models.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { ApiResponse } from "../utils/apiresponse.js";

const createChannel= asyncHandler(async(req,res)=>{
    const{name,description}= req.body
    if(!name||!name.trim()){
        throw new ApiError(400,"Enter a valid name for the channel")
    }
    if(!description ||!description.trim()){
        throw new ApiError(400,"Enter a valid description for the channel")
    }

    const createdChannel= await Channel.create(
        {
            owner:req.user._id,
            name:name,
            description:description
        }
    )
   
    if(!createdChannel){
        throw new ApiError(400,"Unable to create the channel")
    }
    return res.status(201)
    .json(new ApiResponse(200,"created the channel successfully",createdChannel))
})

const getUserChannel= asyncHandler(async(req,res)=>{
    const {userId}= req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid ObjectId")
    }
    const user= await User.findById(userId);
    if(!user){
        throw new ApiError(404,"user not found")
    }
    const channel= await Channel.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        
        {
            $project: {
                name: 1,
                description: 1,
                   // Rename or assign the looked-up videos to the field "video"
            }
        }
    ])

    if(channel.length===0){
        throw new ApiError(404,"No channel found")
    }
    return res.status(200)
    .json(new ApiResponse(200,"fetched the channel successfully",channel))
})

const deleteChannel = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }

    const fetchChannel= await Channel.findById(channelId);
    if(!fetchChannel){
        throw new ApiError(404,"No such channel found")
    }
    if(fetchChannel.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to delete this channel!");
    }

    const deletedChannel= await Channel.findByIdAndDelete(channelId)
    if(!deletedChannel){
        throw new ApiError(500, "failed to delete the channel!");
    }
    return res.status(200)
    .json(new ApiResponse(200,"successfully deleted the channel",deletedChannel))
})


const updateChannel = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channelId")
    }

    if(!name||!name.trim()){
        throw new ApiError(400,"Enter a valid name for the channel")
    }
    if(!description ||!description.trim()){
        throw new ApiError(400,"Enter a valid description for the channel")
    }
    
    const fetchChannel= await Channel.findById(channelId);
    if(!fetchChannel){
        throw new ApiError(404,"No channel found")
    }

    if(fetchChannel.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to update this channel!");
    }

    const updatedChannel= await Channel.findByIdAndUpdate(channelId,{
        $set:{
            name:name,
            description:description
        }
    },{new:true})

    if(!updatedChannel){
        throw new ApiError(500, "failed to update the channel!");
    }

    return res.status(200)
    .json(new ApiResponse(200,"successfully updated the channel",updatedChannel))  
})

export{
    createChannel,
    getUserChannel,
    deleteChannel,
    updateChannel
}
