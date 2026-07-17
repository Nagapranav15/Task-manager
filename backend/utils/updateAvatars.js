require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../model/User");

const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://root:root11@taskmanager.mjedulh.mongodb.net/?retryWrites=true&w=majority&appName=taskManager";

const updateProfilePictures = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGO_URL);
        console.log("Database connected successfully.");

        // Find users with missing, null, or empty profile images
        const users = await User.find({
            $or: [
                { profileImageUrl: null },
                { profileImageUrl: "" },
                { profileImageUrl: { $exists: false } }
            ]
        });

        console.log(`Found ${users.length} users with missing profile pictures.`);

        for (const user of users) {
            // Generate a premium random seed avatar based on the user's name
            const seed = encodeURIComponent(user.name.trim().toLowerCase());
            const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
            
            user.profileImageUrl = avatarUrl;
            await user.save();
            console.log(`Updated user "${user.name}" with avatar seed "${seed}"`);
        }

        console.log("Profile pictures updated successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Failed to update profile pictures:", error);
        process.exit(1);
    }
};

updateProfilePictures();
