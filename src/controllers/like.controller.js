import mongoose,{isValidObjectId} from "mongoose";
import {Like} from "../models/like.models.js";
import { ApiResponse } from "../utils/apiresponse.js";
import {ApiError} from "../utils/apierror.js";
import {asyncHandler} from "../utils/asynchandler.js";
import { User } from "../models/users.models.js";
import{video} from "../models/video.models.js"
const toggleVideoLike= asyncHandler(async(req,res)=>{
    const{videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const existingLike=await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })
    if(!existingLike){
        const like= await Like.create({
            video:videoId,
            likedBy:req.user._id
        })
        
        return res.status(201).json(new ApiResponse(201, "Liked the video successfully"))
    }
    const unlike= await Like.deleteOne({
        video:videoId,
        likedBy:req.user._id
    })
    if(unlike.deletedCount===0){
        throw new ApiError(500, "Failed to unlike the video ")
    }
    return res.status(200).json(new ApiResponse(200, "Unliked the video successfully"))
})

const toggleCommentLike= asyncHandler(async(req,res)=>{
    const {commentId}= req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    const existingLike= await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })

    if(!existingLike){
        const like= await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })
        return res.status(200)
        .json(new ApiResponse(202,"successfully liked the comment"))
    }

    const unlike= await Like.deleteOne({
        comment:commentId,
        likedBy:req.user._id
    })
    if(unlike.deletedCount==0){
        throw new ApiError(400,"unable to unlike the comment")
    }
    return res.status(200)
    .json(new ApiResponse(200,"successfully Unliked the comment"))
})

const toggleTweetLike= asyncHandler(async(req,res)=>{
    const {tweetId}= req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const existingLike=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(!existingLike){
        const like= await Like.create({
            tweet:tweetId,
            likedBy:req.user._id
        })
        
        return res.status(201).json(new ApiResponse(201, "Liked the tweet successfully"))
    }
    const unlike= await Like.deleteOne({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(unlike.deletedCount===0){
        throw new ApiError(500, "Failed to unlike the tweet")
    }
    return res.status(200).json(new ApiResponse(200, "Unliked the tweet successfully"))

})

const getAllLikedVideo= asyncHandler(async(req,res)=>{
    const userId= req.user._id
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    const likedVideo= await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId),
                video:{$ne:null} //Ensures only video likes are considered
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedvideos"
            }
        },
        {
            $unwind:"$likedvideos"
        },
        {
            $lookup:{
                from:"users",
                localField:"likedvideos.owner",
                foreignField:"_id",
                as: "videoOwner"
            }
        },
        {
            $unwind:"$videoOwner"
        },

        {
            $project:{
                title: "$likedVideos.title",
                thumbnail: "$likedVideos.thumbnail",
                videoOwner:{
                    fullname:1,
                    username:1,
                    avatar:1
                }
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, "Fetched all liked videos", likedVideo));

})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getAllLikedVideo
}

