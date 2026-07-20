const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        meetLink: {
            type: String,
            default: ""
        },
        googleEventId: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ["Scheduled", "Completed", "Cancelled"],
            default: "Scheduled"
        }
    },
    { timestamps: true }
);

meetingSchema.index({ organizer: 1, startTime: -1 });
meetingSchema.index({ participants: 1, startTime: -1 });
meetingSchema.index({ startTime: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
