import mongoose from "mongoose";

const connectDB = () => {
    mongoose.connect(process.env.MONGODB_URI,{dbName:"Pawsitive_Paths"}).then(()=>{
        console.log("Connected to DB");
    }).catch((err)=>{
        console.log(err);
    })
}

export {connectDB}