const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["owner", "admin", "member"],
            default: "member"
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { _id: false }
);

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            maxlength: 512,
            default: ""
        },
        avatarUrl: {
            type: String,
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        participants: [participantSchema],
        settings: {
            whoCanSendMessages: {
                type: String,
                enum: ["all", "admins"],
                default: "all"
            },
            whoCanEditInfo: {
                type: String,
                enum: ["all", "admins"],
                default: "all"
            },
            whoCanAddParticipants: {
                type: String,
                enum: ["all", "admins"],
                default: "all"
            },
            disappearingMessagesSeconds: {
                type: Number,
                default: null
            }
        },
        inviteCode: {
            type: String,
            unique: true,
            sparse: true
        },
        inviteCodeCreatedAt: {
            type: Date
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

groupSchema.index({ "participants.user": 1 });

module.exports = mongoose.model("Group", groupSchema);
