import {User} from "../models/users.models.js"
import {Subscription} from "../models/subscriptions.models.js"
import {ApiError} from "../utils/apierror.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {ApiResponse} from "../utils/apiresponse.js"
import mongoose, {isValidObjectId} from "mongoose"

const toggleSubscription = asyncHandler(async (req, res) => {
    //toggle subscription
    const {channelId}=req.params
    if(!isValidObjectId(channelId)){
        return new ApiError(400, "Invalid channel id")
    }
    const user=req.user
    const subscription = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId
    })
    if(!subscription){
           try {
             const newSubscription = await Subscription.create({
                 subscriber: user._id,
                 channel: channelId
             })
             
             return res.status(201).json(new ApiResponse(201, "Subscribed"));
           } catch (error) {
               throw new ApiError(500, "some error occoured while subscribing")
            
           }
                
    }else{
        //channel is subscribed, unsubscribe
        const unSubscribe= await Subscription.deleteOne({
            subscriber: user._id,
            channel: channelId
        })
        if(unSubscribe.deletedCount===0){
            throw new ApiError(500, "some error occoured while unsubscribing")
        }
        return res.status(200).json(new ApiResponse(200, "Unsubscribed"));  
    }

})

const getUserChannelSubscribers= asyncHandler(async (req,res)=>{
    const {channelId}= req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }
    const subscribers= await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId.trim())
            }
        },    
            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscribers"
                }
            },
            {
                $addFields:{
                    subscriberCount:{$size:"$subscribers"}
                }
            },
            {
                $unwind: "$subscribers"  // Unwind to flatten the array of subscribers
            },
            {
                $project:{
                
                        "subscribers.fullName":1,
                        "subscribers.username":1,
                        "subscribers.email":1,
                        "subscribers.isSubscribed":1,
                        "subscribers.avatar":1,
                        "subscribers.coverImage":1    
                }
            }
    ])

    if(subscribers.length===0){
        return res.status(404).json(new ApiResponse(404, "No subscribers found"))
    }
    return res.status(200).json(new ApiResponse(200, subscribers));
})

const getSubscribedChannels= asyncHandler(async (req,res)=>{
    const {subscriberId}= req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriberId")
    }
    const getChannels= await Subscription.aggregate([
        {
            $match:{
                subscriber:mongoose.Types.ObjectId(subscriberId.trim())
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channels"
            }
        },
        {
            $addFields:{
                channelCount:{$size:"$channels"}
            }
        },
        {
            $unwind: "$channels"
        },
        {
            $project:{
                "channels.fullName":1,
                "channels.username":1,
                "channels.email":1,
                "channels.isSubscribed":1,
                "channels.avatar":1,
                "channels.coverImage":1
            }
        }
    ])
    if(getChannels.length===0){
        return res.status(404).json(new ApiResponse(404, "No channels found"))
    }
    return res.status(200).json(new ApiResponse(200, getChannels));
})

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}