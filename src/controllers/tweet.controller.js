import mongoose,{isValidObjectId, Schema} from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/apierror.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {User} from "../models/users.models.js"

const createTweet= asyncHandler(async(req,res)=>{
    const {TweetContent}=req.body
    if(!TweetContent ||TweetContent.trim()===""){
        throw new ApiError(400,"Enter a valid tweet content")
    }
    
    const createdTweet= await Tweet.create({
        owner:new mongoose.Types.ObjectId(req.user._id),
        content:TweetContent.toString()
    })

    if(!createdTweet){
        throw new ApiError(500,"Tweet not created!");
    }
    return res.status(201)
    .json(new ApiResponse(201 ,"Tweet created Successfully",createdTweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId}= req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid userId")
    }

    const user= User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const tweets= await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                owner:1,
                content:1
            }
        }
    ])
    if(tweets.length===0){
        throw new ApiError(404,"No tweet found!")
    }
    return res.status(200)
    .json(new ApiResponse(201 ,"Tweets fetched Successfully",tweets))

})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"Invalid tweetId")
    }
    const {newContent}=req.body
    if(!newContent ||newContent.trim()===""){
        throw new ApiError(400,"Enter a valid new tweet content")
    }

    const existingTweet= await Tweet.findById(tweetId)
    if(!existingTweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(existingTweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"User is not authorized to update the tweet")
    }

    const updatedTweet= await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content:newContent
            }
        },
        {new:true}
    )

    if(!updatedTweet){
        throw new ApiError(500,"some error occoured while updating the tweet!")
    }
    res.status(200)
    .json(new ApiResponse(200 ,"Tweet updated Successfully",updatedTweet))

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"Invalid tweetId")
    }
    const existingTweet= await Tweet.findById(tweetId)
    if(!existingTweet){
        throw new ApiError(404,"Tweet to be deleted, not found")
    }
    if(existingTweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"User is not authorized to delete the tweet")
    }

    const deletedTweet= await Tweet.findByIdAndDelete(tweetId);
    if(!deletedTweet){
        throw new ApiError(500,"some error occoured while deleting the tweet!")
    }
    res.status(200)
    .json(new ApiResponse(200 ,"Tweet deleted Successfully",deletedTweet))

})

export{
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
