const mongoose = require("mongoose");

const chatStateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        conversationType: {
            type: String,
            enum: ["dm", "group"],
            required: true
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        lastReadMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        mutedUntil: {
            type: Date,
            default: null
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        isArchived: {
            type: Boolean,
            default: false
        },
        draft: {
            type: String,
            default: ""
        },
        clearedAt: {
            type: Date,
            default: null
        },
        pinnedMessages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message"
            }
        ],
        starredMessages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message"
            }
        ]
    },
    { timestamps: true }
);

chatStateSchema.index({ user: 1, conversationType: 1, conversationId: 1 }, { unique: true });

module.exports = mongoose.model("ChatState", chatStateSchema);
