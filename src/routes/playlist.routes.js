import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, 
    getUserPlaylists, RemoveVideoFromPlaylist, updatePlaylist }
     from "../controllers/playlist.controller.js";

const router=Router();
//secured routes
router.route("/create-playlist").post(verifyJWT,createPlaylist);
router.route("/add-video/:playlistId/:videoId").post(verifyJWT,addVideoToPlaylist)
router.route("/remove-video/:playlistId/:videoId").delete(verifyJWT,RemoveVideoFromPlaylist)
router.route("/update-playlist/:playlistId").patch(verifyJWT,updatePlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT,deletePlaylist)


router.route("/getUser-Playlist/:userId").get(getUserPlaylists);
router.route("/PlaylistById/:playlistId").get(getPlaylistById);




export default router