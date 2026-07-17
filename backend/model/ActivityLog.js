const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        action: { 
            type: String, 
            required: true 
        },
        details: { 
            type: String, 
            required: true 
        },
        task: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Task" 
        },
        createdAt: {
            type: Date,
            expires: 86400 // Deletes log automatically after 24 hours
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
