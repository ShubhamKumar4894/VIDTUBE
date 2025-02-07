import mongoose, {isValidObjectId} from "mongoose";
import { video } from "../models/video.models.js";
import {User} from "../models/users.models.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {ApiError} from "../utils/apierror.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
 /*
 This code snippet is using MongoDB Aggregation to fetch videos from a Video collection based on:
✔ Filtering by userId (video owner)
✔ Searching for a keyword in title/description
✔ Sorting (ascending or descending)
✔ Pagination (page & limit)
  */
const getAllVideos= asyncHandler(async (req,res)=>{
    const {page=1,limit=10,query="",sortBy="createdAt",sortType=1,userId=req.user._id}=req.query
     //TODO: get all videos based on query, sort, pagination
    const user= await User.findById(userId);

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const getAllVideosAggregate=  video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
                $or:[
                    {title:{$regex: query, $options: "i"}},
                    {description:{$regex: query, $options: "i"}}
                ]//the $or expects an array of individual condition objects
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
        },
        {
            $project: {
              title: 1,
              description: 1,
              "videoFile.url": 1,
              "videoFile.public_id": 1,
              owner: 1,
            }
        }    
    ])
    /*
    What this function does is execute the aggregate pipeline with the pagination settings, and it typically 
    returns a promise that resolves with an object containing the paginated results.
     */
    try {
        const result=await video.aggregatePaginate(getAllVideosAggregate,{page,limit})
        return res.status(200).json(new ApiResponse(200, "Videos fetched", result))
        
    } catch (error) {
        throw new ApiError(500, "Some error occoured while fetching videos")
    }


});

const publishVideo= asyncHandler(async (req,res)=>{
    const {title,description,isPublished=true}=req.body
    console.log(description)
    const localVideoPath=req.files?.video?.[0]?.path
    const thumbnail=req.files?.thumbnail?.[0]?.path
    const user= req.user
    console.log(localVideoPath)
    if(!localVideoPath){
        throw new ApiError(400, "Please provide video file")
    }
    if(!thumbnail){
        throw new ApiError(400, "Please provide thumbnail")
    }
    if(!title||title.trim()===""){
        throw new ApiError(400, "title field is required")
    }
    if(!description||description.trim()===""){
        throw new ApiError(400, "description field is required")
    }
    const uploadVideoFile= await uploadOnCloudinary(localVideoPath);
    const uploadThumbnail= await uploadOnCloudinary(thumbnail);

    if(!uploadVideoFile){
        throw new ApiError(500, "Some error occured while uploading video")
    }

    const videoEntry= await video.create({
        videoFile:{
            public_id:uploadVideoFile.public_id,
            url:uploadVideoFile.url
        },
        thumbnail:{
            public_id:uploadThumbnail.public_id,
            url:uploadThumbnail.url
        },
        title:title.trim(),
        description:description.trim(),
        isPublished,
        duration: uploadVideoFile?.duration,
        owner: user._id
    })
    if(!videoEntry){
        throw new ApiError(500, "Some error occured while publishing video")
    }
    return res.status(201).json(new ApiResponse(201, "Video published successfully"));


})

const getVideoById= asyncHandler(async (req,res)=>{
    const {videoId}= req.params
    console.log(videoId)
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const videoFile= await video.findById(videoId).select("-isPublished -updatedAt -createdAt")

    if(!videoFile){
        throw new ApiError(404, "VideoFile  not found")
    }
    return res.status(200).json(new ApiResponse(200, "Video fetched", videoFile))
    
})

const updateVideo= asyncHandler(async (req,res)=>{
    const {videoId}= req.params
    const{title,description}=req.body
    const thumbnail=req.file?.path
    console.log(thumbnail)
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    if(!title||title.trim()===""){
        throw new ApiError(400, "title field is required")
    }
    if(!description||description.trim()===""){
        throw new ApiError(400, "description field is required")
    }
    const previousVideo= await video.findById(videoId);

    if(!previousVideo){
        throw new ApiError(404, "Video not found")
    }
    let uploadThumbnail;
    if(thumbnail){
        if(previousVideo.thumbnail.public_id){
            await deleteFromCloudinary(previousVideo.thumbnail.public_id)
        }
        uploadThumbnail= await uploadOnCloudinary(thumbnail);
        if(!uploadThumbnail){
            throw new ApiError(500, "Some error occoured while uploading thumbnail")
        }   
    }
    let updateVideoDetails;
    try {
        updateVideoDetails= await video.findByIdAndUpdate(videoId,{
            $set:{
                title:title,
                description:description,
                thumbnail:{
                    public_id:uploadThumbnail?.public_id,
                    url:uploadThumbnail?.url
                }
            }    
        },{
            new:true
        })
    } catch (error) {
        throw new ApiError(500, "Some error occoured while updating video")
    }
    return res.status(200).json(new ApiResponse(200,{updateVideoDetails} ,"Video updated successfully"))
})

const deleteVideo= asyncHandler(async (req,res)=>{
    const {videoId}= req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const videoEntry= await video.findById(videoId);
    if(!videoEntry){
        throw new ApiError(404, "VideoFile  not found")
    }
    console.log(videoEntry.videoFile.public_id)
    if(videoEntry.videoFile.public_id){
        const deleteVideo= await deleteFromCloudinary(videoEntry.videoFile.public_id,"video");
        if(!deleteVideo){
            throw new ApiError(500, "Some error occoured while deleting video from cloudinary")
        }
    }
    if(videoEntry.thumbnail.public_id){
        const deleteThumbnail= await deleteFromCloudinary(videoEntry.thumbnail.public_id,"image");
        if(!deleteThumbnail){
            throw new ApiError(500, "Some error occoured while deleting thumbnail from cloudinary")
        }
    }
    const deleteVideoDetails= await video.findByIdAndDelete(videoId)
    if(!deleteVideoDetails){
        throw new ApiError(500, "Some error occoured while deleting video")
    }
    return res.status(200).json(new ApiResponse(200, "Video deleted successfully")) 
})

const togglePublishStatus= asyncHandler(async (req,res)=>{
    const {videoId}= req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const videoFile= await video.findById(videoId);
    if(!videoFile){
        throw new ApiError(404, "VideoFile  not found")
    }
    if(videoFile.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to perform this action")
    }

    videoFile.isPublished=!videoFile.isPublished
    await videoFile.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,"Video publish status updated successfully"))

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}