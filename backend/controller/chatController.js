const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Message = require("../model/Message");
const Group = require("../model/Group");
const ChatState = require("../model/ChatState");

// @desc    Get chat messages for a conversation
// @route   GET /api/chat/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { conversationType, conversationId, peerId, group, limit = 150, before } = req.query;
        let query = {};

        const currentUserId = req.user._id;

        if (conversationType === "group" || group) {
            const targetGroupId = conversationId || group;
            if (!targetGroupId || !mongoose.Types.ObjectId.isValid(targetGroupId)) {
                return res.status(400).json({ message: "Invalid group ID" });
            }

            // Require membership check
            const groupDoc = await Group.findOne({ _id: targetGroupId, isDeleted: false });
            if (!groupDoc) {
                return res.status(404).json({ message: "Group not found" });
            }
            const isMember = groupDoc.participants.some(p => p.user.toString() === currentUserId.toString());
            if (!isMember) {
                return res.status(403).json({ message: "Access denied: Not a member of this group" });
            }

            query = {
                "conversation.type": "group",
                "conversation.group": targetGroupId,
                deletedFor: { $ne: currentUserId }
            };
        } else if (conversationType === "dm" || peerId) {
            const targetPeerId = conversationId || peerId;
            if (!targetPeerId || !mongoose.Types.ObjectId.isValid(targetPeerId)) {
                return res.status(400).json({ message: "Invalid peer ID" });
            }

            query = {
                "conversation.type": "dm",
                $or: [
                    { sender: currentUserId, "conversation.peer": targetPeerId },
                    { sender: targetPeerId, "conversation.peer": currentUserId }
                ],
                deletedFor: { $ne: currentUserId }
            };
        } else {
            // Return all user's DM and group message history preview/all if requested
            query = {
                $or: [
                    { sender: currentUserId },
                    { "conversation.peer": currentUserId }
                ],
                deletedFor: { $ne: currentUserId }
            };
        }

        if (before && mongoose.Types.ObjectId.isValid(before)) {
            query._id = { $lt: before };
        }

        const maxLimit = Math.min(parseInt(limit, 10) || 150, 500);

        const messages = await Message.find(query)
            .populate("sender", "name email profileImageUrl role")
            .populate("replyTo")
            .populate("mentions", "name email")
            .populate("systemEvent.actor", "name email")
            .populate("systemEvent.targets", "name email")
            .sort({ createdAt: -1 })
            .limit(maxLimit);

        messages.reverse();

        res.status(200).json(messages);
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
};

// @desc    Upload attachment file (authenticated)
// @route   POST /api/chat/upload
// @access  Private
const uploadChatFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const isLocal = req.get("host")?.includes("localhost") || req.get("host")?.includes("127.0.0.1");
        const protocol = isLocal ? "http" : "https";
        const fileUrl = `${protocol}://${req.get("host")}/uploads/chat-files/${req.file.filename}`;

        res.status(200).json({
            url: fileUrl,
            name: req.file.originalname,
            mime: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error("Upload Chat File Error:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

// @desc    Get paginated media / docs / links for a conversation
// @route   GET /api/chat/media
// @access  Private
const getChatMedia = async (req, res) => {
    try {
        const { conversationType, conversationId, tab = "media", page = 1, limit = 30 } = req.query;
        if (!conversationType || !conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid parameters" });
        }

        let query = {};
        if (conversationType === "group") {
            const groupDoc = await Group.findOne({ _id: conversationId, isDeleted: false });
            if (!groupDoc) return res.status(404).json({ message: "Group not found" });
            const isMember = groupDoc.participants.some(p => p.user.toString() === req.user._id.toString());
            if (!isMember) return res.status(403).json({ message: "Access denied" });
            query["conversation.group"] = conversationId;
        } else {
            query = {
                "conversation.type": "dm",
                $or: [
                    { sender: req.user._id, "conversation.peer": conversationId },
                    { sender: conversationId, "conversation.peer": req.user._id }
                ]
            };
        }

        if (tab === "media") {
            query.type = { $in: ["image", "video"] };
        } else if (tab === "docs") {
            query.type = { $in: ["document", "audio", "voice"] };
        } else if (tab === "links") {
            query.text = { $regex: /https?:\/\/[^\s]+/, $options: "i" };
        }

        query.deletedFor = { $ne: req.user._id };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Message.countDocuments(query);
        const items = await Message.find(query)
            .populate("sender", "name email profileImageUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({ total, page: parseInt(page), items });
    } catch (error) {
        console.error("Get Chat Media Error:", error);
        res.status(500).json({ message: "Failed to fetch media", error: error.message });
    }
};

// @desc    Full-text search messages & groups
// @route   GET /api/chat/search
// @access  Private
const searchChat = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(200).json({ messages: [], groups: [] });
        }

        const currentUserId = req.user._id;

        // Search user's groups by name or description
        const groups = await Group.find({
            "participants.user": currentUserId,
            isDeleted: false,
            $or: [
                { name: { $regex: q.trim(), $options: "i" } },
                { description: { $regex: q.trim(), $options: "i" } }
            ]
        }).populate("participants.user", "name email profileImageUrl");

        // Search messages in user's conversations
        const userGroupIds = groups.map(g => g._id);

        const messages = await Message.find({
            $text: { $search: q.trim() },
            deletedFor: { $ne: currentUserId },
            $or: [
                { "conversation.group": { $in: userGroupIds } },
                { sender: currentUserId },
                { "conversation.peer": currentUserId }
            ]
        })
        .populate("sender", "name email profileImageUrl")
        .populate("conversation.group", "name avatarUrl")
        .sort({ createdAt: -1 })
        .limit(50);

        res.status(200).json({ groups, messages });
    } catch (error) {
        console.error("Search Chat Error:", error);
        res.status(500).json({ message: "Search failed", error: error.message });
    }
};

// @desc    Get or update user chat states (pin, mute, archive, draft, starred, pinned messages)
// @route   GET & PATCH /api/chat/state
// @access  Private
const getChatStates = async (req, res) => {
    try {
        const states = await ChatState.find({ user: req.user._id });
        res.status(200).json(states);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat states", error: error.message });
    }
};

const updateChatState = async (req, res) => {
    try {
        const { conversationType, conversationId, isPinned, isArchived, mutedUntil, draft, pinnedMessages, starredMessages } = req.body;

        if (!conversationType || !conversationId) {
            return res.status(400).json({ message: "Missing conversationType or conversationId" });
        }

        const updateObj = {};
        if (isPinned !== undefined) updateObj.isPinned = isPinned;
        if (isArchived !== undefined) updateObj.isArchived = isArchived;
        if (mutedUntil !== undefined) updateObj.mutedUntil = mutedUntil;
        if (draft !== undefined) updateObj.draft = draft;
        if (pinnedMessages !== undefined) updateObj.pinnedMessages = pinnedMessages;
        if (starredMessages !== undefined) updateObj.starredMessages = starredMessages;

        const state = await ChatState.findOneAndUpdate(
            { user: req.user._id, conversationType, conversationId },
            { $set: updateObj },
            { new: true, upsert: true }
        );

        res.status(200).json(state);
    } catch (error) {
        res.status(500).json({ message: "Failed to update chat state", error: error.message });
    }
};

module.exports = {
    getMessages,
    uploadChatFile,
    getChatMedia,
    searchChat,
    getChatStates,
    updateChatState
};
