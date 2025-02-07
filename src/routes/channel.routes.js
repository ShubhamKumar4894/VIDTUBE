import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createChannel, deleteChannel, getUserChannel, updateChannel } from "../controllers/channel.controller.js";

const router=Router();
router.route("/create-channel").post(verifyJWT,createChannel);
router.route("/delete-channel/:channelId").delete(verifyJWT,deleteChannel)
router.route("/update-channel/:channelId").patch(verifyJWT,updateChannel)
router.route("/getUser-channel/:userId").get(getUserChannel);


export default router