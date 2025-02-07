import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllLikedVideo, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router=Router();

router.route("/toggle-videoLike/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/toggle-commentLike/:commentId").post(verifyJWT,toggleCommentLike)
router.route("/toggle-tweet-Like/:tweetId").post(verifyJWT,toggleTweetLike)
router.route("/getAllLikedVideo").get(verifyJWT,getAllLikedVideo)

export default router