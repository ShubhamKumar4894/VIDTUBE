import { Router } from "express";
import{verifyJWT}from "../middlewares/auth.middleware.js"   
import {registerUsers,
    logoutUser,
    loginUser,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory,
    refreshAccessToken
} from "../controllers/users.controller.js"

import {upload} from "../middlewares/multer.middleware.js"
const router=Router();

router.route("/register").post(
    upload.fields(
        [
            {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]
    ),
    registerUsers)

router.route("/login").post(loginUser)    

//secure routes    
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(verifyJWT,refreshAccessToken)
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route("/c/:username").get(verifyJWT,getChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)
export default router