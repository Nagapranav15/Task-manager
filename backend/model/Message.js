const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        url: String,
        name: String,
        mime: String,
        size: Number,
        width: Number,
        height: Number,
        durationMs: Number,
        waveform: [Number],
        thumbnailUrl: String
    },
    { _id: false }
);

const reactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
        at: { type: Date, default: Date.now }
    },
    { _id: false }
);

const deliverySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        deliveredAt: Date,
        readAt: Date
    },
    { _id: false }
);

const editSchema = new mongoose.Schema(
    {
        text: String,
        at: { type: Date, default: Date.now }
    },
    { _id: false }
);

const systemEventSchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: [
                "member_added",
                "member_removed",
                "member_left",
                "member_promoted",
                "member_demoted",
                "group_name_changed",
                "group_avatar_changed",
                "group_description_changed",
                "settings_changed",
                "disappearing_messages_changed"
            ]
        },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        targets: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        value: String
    },
    { _id: false }
);

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: {
                type: String,
                enum: ["dm", "group"],
                required: true
            },
            group: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Group",
                default: null
            },
            peer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            }
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: [
                "text",
                "image",
                "video",
                "audio",
                "document",
                "voice",
                "location",
                "contact",
                "poll",
                "system"
            ],
            default: "text"
        },
        text: {
            type: String,
            default: ""
        },
        attachments: [attachmentSchema],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        forwardScore: {
            type: Number,
            default: 0
        },
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        mentionsEveryone: { type: Boolean, default: false },
        reactions: [reactionSchema],
        deliveries: [deliverySchema],
        editedAt: { type: Date, default: null },
        editHistory: [editSchema],
        deletedForEveryoneAt: { type: Date, default: null },
        deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        systemEvent: systemEventSchema,
        expiresAt: { type: Date, default: null }
    },
    { timestamps: true }
);

messageSchema.index({ "conversation.group": 1, createdAt: 1 });
messageSchema.index({ "conversation.peer": 1, sender: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
messageSchema.index({ text: "text" });

module.exports = mongoose.model("Message", messageSchema);
