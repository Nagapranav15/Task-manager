const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        clockInTime: { 
            type: Date, 
            required: true 
        },
        clockOutTime: { 
            type: Date 
        },
        clockInLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String }
        },
        clockOutLocation: {
            latitude: { type: Number },
            longitude: { type: Number },
            address: { type: String }
        },
        status: { 
            type: String, 
            enum: ["Checked-In", "Checked-Out"], 
            default: "Checked-In" 
        }
    },
    { timestamps: true }
);

attendanceSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
