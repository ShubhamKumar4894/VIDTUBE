import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription,getUserChannelSubscribers,getSubscribedChannels } from "../controllers/subscription.controller.js";

const router=Router();


router.route("/toggle-sbscription/:channelId").post(verifyJWT,toggleSubscription)
router.route("/channel-subscriber/:channelId").get(verifyJWT,getUserChannelSubscribers)
router.route("/channel-subscriber/:subscriberId").get(verifyJWT,getSubscribedChannels)

export default router