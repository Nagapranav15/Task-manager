require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const ActivityLog = require("../model/ActivityLog");
const User = require("../model/User");

const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://root:root11@taskmanager.mjedulh.mongodb.net/?retryWrites=true&w=majority&appName=taskManager";

const testDb = async () => {
    try {
        console.log("Connecting to Mongo...");
        await mongoose.connect(MONGO_URL);
        console.log("Connected.");

        // Check users
        const users = await User.find().limit(3);
        console.log("Found users:", users.map(u => u.name));

        if (users.length === 0) {
            console.log("No users found.");
            process.exit(0);
        }

        // Test insert ActivityLog
        const testUser = users[0];
        console.log(`Inserting activity log for user: ${testUser.name} (${testUser._id})`);
        
        const log = await ActivityLog.create({
            user: testUser._id,
            action: "Test Action",
            details: "Diagnostics run successfully"
        });
        console.log("Successfully created log document:", log);

        // Fetch logs
        const logs = await ActivityLog.find().populate("user", "name email");
        console.log("Successfully queried activity logs list. Length:", logs.length);
        console.log("Recent logs:", logs.slice(-2));

        process.exit(0);
    } catch (err) {
        console.error("DIAGNOSTICS ERROR:", err);
        process.exit(1);
    }
};

testDb();
