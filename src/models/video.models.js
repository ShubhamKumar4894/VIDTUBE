import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema= new Schema(
    {
        videoFile: {
            public_id:{
                type: String
            },
            url:{
                type: String
            }
        },
        thumbnail:{
            public_id:{
                type: String
            },
            Url:{
                type: String
            }
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        views:{
            type:Number,
            default:0
        },
        duration:{
            type:Number,
            required:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"user"
        }

    },
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)
export const video= mongoose.model("video",videoSchema);