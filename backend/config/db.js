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
        if (process.env.NODE_ENV !== "production") {
            console.log("Attempting fallback to MongoMemoryServer for local development...");
            try {
                const { MongoMemoryServer } = require("mongodb-memory-server");
                const mongoServer = await MongoMemoryServer.create();
                const uri = mongoServer.getUri();
                await mongoose.connect(uri);
                console.log("Connected to local MongoMemoryServer at:", uri);
                return;
            } catch (fallbackErr) {
                console.error("MongoMemoryServer fallback failed:", fallbackErr.message);
            }
        }
        process.exit(1);
    }
};

module.exports = connectDB;