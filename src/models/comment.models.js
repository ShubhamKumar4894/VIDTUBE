import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
/*
    Pagination: A technique used to retrieve data in chunks (pages) instead of
    fetching the entire dataset. This improves performance when dealing with 
    large collections.
 */
const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        tweet:{
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        }
    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)

export const comment = mongoose.model("Comment", commentSchema)