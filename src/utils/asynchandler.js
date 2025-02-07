const asyncHandler=(requesthandler)=>{
    //hof
    return (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((error)=>next(error));
        //A callback function to pass control to the next middleware 
        //in the stack or error-handling middleware.
    }
}
export {asyncHandler};

