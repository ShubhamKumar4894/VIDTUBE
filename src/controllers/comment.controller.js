import mongoose,{isValidObjectId} from "mongoose";
import {comment} from "../models/comment.models.js";
import { ApiError } from "../utils/apierror.js";
import {ApiResponse} from "../utils/apiresponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import { video } from "../models/video.models.js";

const getVideoComments= asyncHandler(async (req,res)=>{
    const {videoId}=req.params
    const {page=1,limit=10,sortBy="createdAt",sortType=1}=req.query
    //page ko parseInt kar sakte hain
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const videoFile= await video.findById(videoId);
    if(!videoFile){
        throw new ApiError(404, "Video not found")
    }
    const AggregateComments= comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                [sortBy]:sortType
            }
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:parseInt(limit)
        }
    ])
    try {
        //fetches commeents based on page and limit
        const result = await comment.aggregatePaginate(AggregateComments,{page,limit})
        return res.status(200).json(new ApiResponse(200, "Comments fetched", result))
    } catch (error) {
        throw new ApiError(500, "Some error occoured while fetching comments", error)
    }
})

const addComment= asyncHandler(async(req,res)=>{
    const {videoId}= req.params
    const {commentText}= req.body;
    console.log(videoId)
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId provided")
    }
    if(!commentText||commentText.trim()===""){
        throw new ApiError(400, "Comment text is required")
    }
    const videoFile= await video.findById(videoId);
    if(!videoFile){
        throw new ApiError(404,"video file cannot be located")
    }
    const videoComment= await comment.create({
        video: videoId,
        owner: req.user._id,
        content: commentText
    })
    if(!videoComment){
        throw new ApiError(500, "Some error occoured while adding comment")
    }
    return res.status(201).json(new ApiResponse(201, "Comment added successfully", videoComment))
})

const updateComment= asyncHandler(async(req,res)=>{
    const{commentId}=req.params
    const {newComment}=req.body
    console.log(commentId)

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }
    if(!newComment||newComment.trim()===""){
        throw new ApiError(400, "New comment text is required")
    }
    const commentToUpdate= await comment.findById(commentId)
    if(!commentToUpdate){
        throw new ApiError(404, "Comment not found")
    }
    //a check so that only the owner can update a comment
    if(commentToUpdate.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to update this comment")
    }
    const commentUpdate= await comment.findByIdAndUpdate(commentId,{
        $set:{
            content:newComment
        }
    },
    {
        new:true
    }
)
    if(!commentUpdate){
        throw new ApiError(500, "Some error occoured while updating comment")
    }
    return res.status(200).json(new ApiResponse(200, "Comment updated successfully", commentUpdate))
})

const deleteComment= asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }
    const commentToDelete= await comment.findById(commentId);
    if(!commentToDelete){
        throw new ApiError(404, "Comment not found")
    }
    if(commentToDelete.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403, "You are not allowed to delete this comment")
    }
    const deletedComment=await comment.findByIdAndDelete(commentId);
    if(!deletedComment){
        throw new ApiError(500, "Some error occoured while deleting comment")
    }
    return res.status(200).json(new ApiResponse(200, "Comment deleted successfully"))
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}