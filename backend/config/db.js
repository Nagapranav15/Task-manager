const mongoose = require("mongoose");

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL, {
            maxPoolSize: 25,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB Connected with High-Concurrency Pool (25 maxPoolSize)");
    }catch(err){
        console.error("MongoDB Connection error:",err.message);
        process.exit(1);
    }
};

module.exports = connectDB;