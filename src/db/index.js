import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async function () {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.METHOD_URL}/${DB_NAME}`)

        console.log(`MongoDb connected! DB host: ${connectionInstance.connection.host}`)    
    }
    catch (error){ 
        console.log("Couldn't connect database",error)
        process.exit(1)
    }
}
export default connectDB