import mongoose,{isValidObjectId} from "mongoose"
import {playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/apierror.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {ApiResponse} from "../utils/apiresponse.js"
import {User} from "../models/users.models.js"
import {video} from "../models/video.models.js"

const createPlaylist= asyncHandler(async(req,res)=>{
    const {name,description}=req.body
    if(!name||!name.trim()){
        throw new ApiError(400,"Enter a valid name for the playlist")
    }
    if(!description ||!description.trim()){
        throw new ApiError(400,"Enter a valid description for the playlist")
    }

    const existingPlaylist= await playlist.findOne({
        name:name,
        owner:req.user._id
    })

    if(existingPlaylist){
        throw new ApiError(400,"Playlist already exists")
    }

    const createdPlaylist=await playlist.create({
        name:name,
        description:description,
        owner:req.user._id
    })

    if(!createdPlaylist){
        throw new ApiError(400,"Unable to create the playlist")
    }
    return res.status(201)
    .json(new ApiResponse(200,"created the playlist successfully",createdPlaylist))
})


const getUserPlaylists= asyncHandler(async(req,res)=>{
    const {userId}= req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid ObjectId")
    }
    const user= await User.findById(userId);
    if(!user){
        throw new ApiError(404,"user not found")
    }
    const playlists= await playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
           $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"videoFile",
                as:"AllVideos"
           }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                video: "$AllVideos"    // Rename or assign the looked-up videos to the field "video"
            }
        }
    ])

    if(playlists.length===0){
        throw new ApiError(404,"No playlist found")
    }
    return res.status(200)
    .json(new ApiResponse(200,"fetched the playlist successfully",playlists))
})

const getPlaylistById= asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }

    const findPlaylist= await playlist.findById(playlistId);
    if(!findPlaylist){
        throw new ApiError(404,"Playlist not found")
    }
    return res.status(200)
    .json(new ApiResponse(200,"Successfully fetched the playlist",findPlaylist))

})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const fetchPlaylist= await playlist.findById(playlistId);
    if(!fetchPlaylist){
        throw new ApiError(404,"No playlist found")
    }
    if(fetchPlaylist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to add video in this playlist!");
    }
    const fetchVideo= await video.findById(videoId);
    if(!fetchVideo){
        throw new ApiError(404,"video not found!")
    }

    if(fetchPlaylist.video.includes(videoId)){
        throw new ApiError(400, "video already exists in this playlist!");
    }

    const addedVideoToPlaylist=await playlist.findByIdAndUpdate(playlistId,{
        $push:{
            video:videoId
        }
    },
    {new:true})
    if(!addedVideoToPlaylist){
        throw new ApiError(500, "failed to add video to the playlist!");
    }

    return res.status(200)
    .json(new ApiResponse(200,"successfully added to the playlist",addedVideoToPlaylist))
})

const RemoveVideoFromPlaylist= asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const fetchPlaylist= await playlist.findById(playlistId);
    if(!fetchPlaylist){
        throw new ApiError(404,"playlist not found")
    }
    if(fetchPlaylist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to remove video from this playlist!");
    }
    if(!fetchPlaylist.video.includes(videoId)){
        throw new ApiError(400, "video to be deleted is not present in the playlist!");
    }

    const fetchVideo= await video.findById(videoId);
    if(!fetchVideo){
        throw new ApiError(404,"video not found!")
    }

    const RemoveVideo= await playlist.findByIdAndUpdate(playlistId,
        {
            $pull:{
                video:videoId
            }
        },{new:true}
    )
    if(!RemoveVideo){
        throw new ApiError(500, "failed to remove video from the playlist!");
    }
    return res.status(200)
    .json(new ApiResponse(200,"successfully removed from the playlist",RemoveVideo))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }

    const fetchPlaylist= await playlist.findById(playlistId);
    if(!fetchPlaylist){
        throw new ApiError(404,"No such playlist found")
    }
    if(fetchPlaylist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to delete this playlist!");
    }

    const deletedPlaylist= await playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(500, "failed to delete the playlist!");
    }
    return res.status(200)
    .json(new ApiResponse(200,"successfully deleted the playlist",deletedPlaylist))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }

    if(!name||!name.trim()){
        throw new ApiError(400,"Enter a valid name for the playlist")
    }
    if(!description ||!description.trim()){
        throw new ApiError(400,"Enter a valid description for the playlist")
    }
    
    const fetchPlaylist= await playlist.findById(playlistId);
    if(!fetchPlaylist){
        throw new ApiError(404,"No playlist found")
    }

    if(fetchPlaylist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "You don't have permission to update this playlist!");
    }

    const updatedPlaylist= await playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name:name,
            description:description
        }
    },{new:true})

    if(!updatedPlaylist){
        throw new ApiError(500, "failed to update the playlist!");
    }

    return res.status(200)
    .json(new ApiResponse(200,"successfully updated the playlist",updatedPlaylist))  
})

export{
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    RemoveVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}