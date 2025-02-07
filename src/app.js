import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app= express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        //The origin option specifies which domains (origins) are allowed to access your server.
        credentials:true
        /*
        This option allows cookies, authorization headers, or other 
        credentials to be sent with cross-origin requests.
         */
    })
)
app.use(express.json({limit: "16kb"}))
//This middleware parses incoming URL-encoded form data (like data submitted 
//via an HTML form with application/x-www-form-urlencoded encoding) 
//and makes it available in req.body.
app.use(express.urlencoded({extended: true,limit:"16kb"}))
/*
 Setting extended to true instructs the middleware to use a library
  called qs to handle more complex data structures, 
  such as nested objects or arrays, within the form.
 */
app.use(express.static("public"))
app.use(cookieParser());

import healthCheckRouter from "./routes/healthcheck.routes.js"
app.use("/api/v1/healthcheck", healthCheckRouter)

import userRouter from "./routes/users.routes.js"
app.use("/api/v1/users", userRouter)

import videoRouter from "./routes/videos.routes.js"
app.use("/api/v1/video",videoRouter)

import commentRouter from "./routes/comment.routes.js"
app.use("/api/v1/comment",commentRouter)

import tweetRouter from "./routes/tweet.routes.js"
app.use("/api/v1/tweet",tweetRouter)

import playlistRouter from "./routes/playlist.routes.js"
app.use("/api/v1/playlist",playlistRouter)

import likeRouter from "./routes/like.routes.js"
app.use("/api/v1/like",likeRouter)

import subscriptionRouter from "./routes/subscription.routes.js"
app.use("/api/v1/subscription",subscriptionRouter)

import channelRouter from "./routes/channel.routes.js"
app.use("/api/v1/channel",channelRouter)

import dashboardRouter from "./routes/dashboard.routes.js"
app.use("/api/v1/dashboard",dashboardRouter)

export {app}