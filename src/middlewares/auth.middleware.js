import {asyncHandler} from "../utils/asynchandler.js"

import {ApiError} from "../utils/apierror.js"
import {User} from "../models/users.models.js"
import jwt from "jsonwebtoken"

export const verifyJWT= asyncHandler(async(req,_,next)=>{
    try {
        const token= req.cookies?.accessToken||
        req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized");
        }
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user= await User.findById(decodedToken?._id)
        .select("-password -RefreshToken");
        if(!user){
            throw new ApiError(401,"Unauthorized");
        }
        req.user=user;/*A new property user is added to the req object. */
        next();
    } catch (error) {
        throw new ApiError(401,error.message||"unauthorized access");
    }
})