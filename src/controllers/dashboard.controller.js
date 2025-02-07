import mongoose, {isValidObjectId}from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { comment } from "../models/comment.models.js";
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/apierror.js"   
import{video} from "../models/video.models.js"
import {Subscription} from "../models/subscriptions.models.js"

const getChannelStats= asyncHandler(async(req,res)=>{
    const {channelId}= req.params
    console.log(channelId)
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }
    const channelSubscribers= await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count:"subscribers"
        }
    ])
    let totalChannelViews;
    try {
        totalChannelViews= await video.aggregate([
            {   
                $match:{
                    owner:new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group:{
                    _id:null,
                    totalviews:{$sum:"$views"}
                }
            },
            {
                $project:{
                    _id:0,
                    totalviews:1
                }   
            }
        ])
    } catch (error) {
        throw new ApiError(500, "Some error occoured while fetching channel views", error)
    }
    let getTotalVideos;
    try {
        getTotalVideos= await video.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $count:"totalvideos"
            }
        ])
    } catch (error) {
        throw new ApiError(500, "Some error occoured while fetching channel videos", error) 
    }

    const totalLikes= await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group:{
                _id:null,
                totalVideoLikes:{
                    $sum: {
                        $cond: [
                            { $ifNull: ["$video", false] },
                            1, // not null then add 1
                            0 // else 0
                        ]
                    }
                },
                totalTweetLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$tweet", false]},
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum:{
                        $cond:[
                            {$ifNull:["$comment", false]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])

    const stats={
        totalSubscribers:channelSubscribers[0]?channelSubscribers[0].subscribers:0,
        totalChannelViews:totalChannelViews[0]?totalChannelViews[0].totalviews:0,
        totalVideos:getTotalVideos[0]?getTotalVideos[0].totalvideos:0,
        totalLikes:totalLikes[0]?totalLikes[0]:{ totalVideoLikes: 0, totalTweetLikes: 0, totalCommentLikes: 0 }
    }
    return res.status(200).json(new ApiResponse(200, "Channel stats fetched", stats))

})

const getChannelVideos= asyncHandler(async(req,res)=>{
    const{channelId}=req.params
    const{page=1,limit=10}=req.query    
    try {
        const getAllvideos=await video.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $skip:(page-1)*limit
            },
            {
                $limit:parseInt(limit)
            }
        ])
        return res.status(200).json(new ApiResponse(200, "Channel videos fetched", getAllvideos))
    } catch (error) {
        throw new ApiError(500, "Some error occoured while fetching channel videos", error)
        
    }
})

export {getChannelStats, getChannelVideos}

