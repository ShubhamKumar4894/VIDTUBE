import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/apiresponse.js";

const healthCheck= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,"ok","Health check passed"))
})

export {healthCheck}