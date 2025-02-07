import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
      /*
        req: The HTTP request object.
        file: The uploaded file metadata (e.g., file name, MIME type).
        cb: A callback function used to indicate where to save the file.
      */ 
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ 
    storage,
})
