import {asyncHandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/apierror.js"
import {User} from "../models/users.models.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"
import mongoose, {isValidObjectId} from "mongoose";

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.RefreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };  // Return as an object
    } catch (error) {
        // Handle any errors and throw ApiError
        throw new ApiError(404, "Unable to generate tokens: " + error.message);
    }
};


const registerUsers= asyncHandler( async(req,res)=>{
    const{fullname,username,email,password}=req.body
    if([fullname,username,email,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        return res.status(400).json({ message: "User already exists." });
    }

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverLocalPath=req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    // const avatar= await uploadOnCloudinary(avatarLocalPath);
    // const coverImage="";
    // if(coverLocalPath){
    //     coverImage=await uploadOnCloudinary(coverLocalPath)
    // }

    let avatar;
    try {
        avatar= await uploadOnCloudinary(avatarLocalPath)
        console.log("uploaded avatar",avatar)
    } catch (error) {
        console.log("Error Uploading avatar",error);
        throw new ApiError(500,"failed to upload avatar");
    }

    let coverImage;
    try {
        coverImage= await uploadOnCloudinary(coverLocalPath)
        console.log("uploaded coverImage",coverImage)
    } catch (error) {
        console.log("Error Uploading coverImage",error);
        throw new ApiError(500,"failed to upload coverImage");
    }
    try {
        const user=await User.create({
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url||"",
            email,
            password,
            username:username.toLowerCase()
        })
        const createduser=await User.findById(user._id).select(
            "-password -RefreshToken"
        )
        if(!createduser){
            throw new ApiError(500,"something went wrong");
        }
        return res
        .status(201)
        .json(new ApiResponse(200,createduser,"user reqistered successfully"))
    }catch(error){
        console.log("user creation failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)//public_id is the unique identification generated by cloudinary
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500,"something went wrong while registering a user images were del ")
    }
})  

const loginUser= asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body
    console.log(username)
    console.log(email)
    if(!email){
        throw new ApiError(404,"Enter a valid email id")
    }
    const user= await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(405,"please register user")
    }

    //password validation
    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"invalid password")
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)
    const loggedInUser= await User.findById(user._id)
    .select("-password -RefreshToken");

    const option={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(new ApiResponse(200,
        {user:loggedInUser,accessToken,refreshToken},
        "user logged in successfully"
    ));
})

const logoutUser=asyncHandler(async(req,res)=>{
    const user= await User.findById(req.user._id)
    console.log(user);
    if(!user){
        throw new ApiError(404,"user not found")
    }
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                RefreshToken:undefined,
            }
        },
        {new:true}//return the updated document
    )
    const option={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }
    return res.status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiResponse(200, {},"user logged out successfully",user))
})

const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken;//sec option in case of mobile devs
    if(!incomingRefreshToken){
        throw new ApiError(401,"refresh token is required");
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user= await User.findById(decodedToken?._id)//refresstoken me _id field mentioned h
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }

        if(incomingRefreshToken!== user?.RefreshToken){
            throw new ApiError(401,"Invalid refresh Token");
        }
        const option={
            httpOnly:true,
            secure:process.env.NODE_ENV==="production"
        }
        const {accessToken,refreshToken:newRefreshToken}=await
        generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken",accessToken,option)
            .cookie("refreshToken",newRefreshToken,option)
            .json(new ApiResponse(200,
            {user:accessToken,refreshToken:newRefreshToken},
            "Access token refreshed successfully"
    ))
    } catch (error) {
        throw new ApiError(500,"error occoured while refreshing the access token")
    }
});

const changePassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user= await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const isPasswordValid= await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid old password");
    }
    user.password=newPassword;//validation is done by bcrypt
    await user.save({validateBeforeSave:false});

    return res.status(300)
    .json(new ApiResponse(200,{},"password changed!"))
})

const getCurrentUser= asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    return res.status(200)
    .json(new ApiResponse(200,user,"user found"))
})
const updateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname||!email){
        throw new ApiError(400,"fullname and email fields are required");
    }
    const user= await User.findByIdAndUpdate(req.user._id,{
        $set:{
            fullname:fullname,
            email:email
        }
    },{new:true}
).select("-password -RefreshToken");

return res.status(200)
.json(new ApiResponse(200,user,"Account details updated successfully"))

})    

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    console.log("Uploaded Files:", req.file);
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }
    let avatar;
    try {
        avatar=await uploadOnCloudinary(avatarLocalPath);
    } catch (error) {
        throw new ApiError(500,"failed to upload avatar");
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
    ).select("-password -RefreshToken")
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))


})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalpath=req.file?.path;
    if(!coverImageLocalpath){
        throw new ApiError(400,"Cover image file is missing");
    }
    let coverImage= await uploadOnCloudinary(coverImageLocalpath);
    if(!coverImage.url){
        throw new ApiError(500,"failed to upload cover image"); 
    }
    const user = await User.findByIdAndUpdate(req.user.id,{
        $set:{
            coverImage:coverImage.url
        }
    },
    {
        new:true
    }
        
    ).select("-password -RefreshToken")
    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getChannelProfile= asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is required");
    }

    const channel= await User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
            /*
            This $lookup is similar to the first one, 
            but this time it's looking for subscriptions 
            where the current user is the subscriber (instead of being the channel).
             */
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                    //whether userid i present in the subscribers array  especially in 
                    //subscriber field.
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel not found");
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"Channel found"))
})

const getWatchHistory= asyncHandler(async(req,res)=>{
    
    const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup:{
                from:"video",//might be err
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",//specifies that MongoDB should use the watchHistory field
                //  from the User document. This field contains an array of video IDs (as ObjectIds).
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1, 
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $arrayElemAt:["$owner",0]
                            }
                        }
                    }
                ]

            }
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))

})
export {
    registerUsers,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory
};