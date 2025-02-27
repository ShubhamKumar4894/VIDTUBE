import mongoose ,{Schema} from "mongoose";

const playlistSchema= new Schema(
    {
        name:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        video:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {timestamps:true}
)

export const playlist= mongoose.model("playlist",playlistSchema);