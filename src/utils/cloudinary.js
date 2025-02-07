import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv"
dotenv.config()
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"//automatically gets the file type like img,vid etc
        })
        console.log("file uploaded on cloudinary")
        // file has been uploaded successfully
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;//Contains metadata about the uploaded file, such as the file's URL, public ID, size, and more.

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteFromCloudinary = async (publicId,resource_type) => {
    if(!publicId) return null
    try {
        return await cloudinary.uploader.destroy(publicId, {
            resource_type,
        })
    } catch (error) {
        console.log(error)
        return null
    }
};
export {uploadOnCloudinary,deleteFromCloudinary}