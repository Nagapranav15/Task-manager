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

module.exports = mongoose.model("Message", messageSchema);
