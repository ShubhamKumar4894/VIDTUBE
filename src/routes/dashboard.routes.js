import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats,getChannelVideos } from "../controllers/dashboard.controller.js";

const router= Router();

router.route("/channelStats/:channelId").get(verifyJWT,getChannelStats)
router.route("/channel-videos/:channelId").get(getChannelVideos)

export default router