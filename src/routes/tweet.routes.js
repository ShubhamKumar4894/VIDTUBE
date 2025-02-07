import { Router } from "express";
import{verifyJWT}from "../middlewares/auth.middleware.js"

const router=Router();
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
}from "../controllers/tweet.controller.js"


router.route("/create-tweet").post(verifyJWT,createTweet);
router.route("/update-tweet/:tweetId").patch(verifyJWT,updateTweet)
router.route("/detete-tweet/:tweetId").delete(verifyJWT,deleteTweet)
router.route("/user-tweets/:userId").get(getUserTweets)

export default router