import mongoose,{Schema} from "mongoose";

const channelSchema= new Schema(
    {
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        name:{
            type:String,
            required:true
        },
        description:{
            type:String
        },
        subscriberCount:{
            type:Number,
            default:0
        }
    },{timestamps:true}
)

export const Channel= mongoose.model("Channel",channelSchema)