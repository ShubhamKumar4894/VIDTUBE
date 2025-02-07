import { Router } from "express";
import{verifyJWT}from "../middlewares/auth.middleware.js" 

import{
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
const router=Router();
router.route("/publish-video").post(verifyJWT,
    upload.fields(
        [
            {
                name:"video",
                maxCount:1
            },
            {
                name:"thumbnail",
                maxCount:1
            }
        ]
    ),publishVideo
);
router.route("/getAllVideos").get(verifyJWT,getAllVideos)
router.route("/video/:videoId").get(verifyJWT,getVideoById)

router.route("/update-video/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);

router.route("/toggle-publishStatus/:videoId").patch(verifyJWT,togglePublishStatus)

export default router