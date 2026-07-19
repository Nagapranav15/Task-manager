const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        group: {
            type: String,
            default: "" // empty if direct message; e.g. "general" for company group chat
        },
        text: {
            type: String,
            required: false
        },
        fileUrl: {
            type: String,
            default: ""
        },
        fileName: {
            type: String,
            default: ""
        },
        fileType: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ group: 1 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-expire messages older than 90 days (3 months)

// Compound indexes for optimized query + sort
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
