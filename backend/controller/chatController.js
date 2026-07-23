const Message = require("../model/Message");
const Group = require("../model/Group");
const fs = require("fs");
const path = require("path");
const { encrypt, decrypt } = require("../utils/encryption");

const mongoose = require("mongoose");

// @desc    Get chat history
// @route   GET /api/chat/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { receiverId, group, all } = req.query;
        let query = {};

        if (all === "true") {
            query = {
                $or: [
                    { sender: req.user._id },
                    { receiver: req.user._id }
                ]
            };
        } else if (group) {
            if (mongoose.Types.ObjectId.isValid(group) && String(group).length === 24) {
                query = {
                    $or: [
                        { sender: req.user._id, receiver: group },
                        { sender: group, receiver: req.user._id }
                    ]
                };
            } else if (group === "general" || group === "general_group" || group === "") {
                query = {
                    group: { $in: ["general", "general_group", ""] },
                    receiver: null
                };
            } else {
                query = {
                    group: group,
                    receiver: null
                };
            }
        } else if (receiverId && receiverId !== "undefined" && mongoose.Types.ObjectId.isValid(receiverId)) {
            query = {
                $or: [
                    { sender: req.user._id, receiver: receiverId },
                    { sender: receiverId, receiver: req.user._id }
                ]
            };
        } else {
            query = {
                group: "general"
            };
        }

        const messages = await Message.find(query)
            .populate("sender", "name email profileImageUrl")
            .sort({ createdAt: -1 })
            .limit(150);

        // Reverse to return messages in chronological order
        messages.reverse();

        const host = req.get("host") || "";
        const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

        const cleanedMessages = messages.map((m) => {
            const obj = m.toObject();
            if (obj.fileUrl && typeof obj.fileUrl === "string" && !isLocal) {
                obj.fileUrl = obj.fileUrl
                    .replace(/^http:\/\/(localhost:8080|127\.0\.0\.1:\d+)/i, "https://task-manager-backend-fpwb.onrender.com")
                    .replace(/^http:\/\/task-manager-backend-fpwb\.onrender\.com/i, "https://task-manager-backend-fpwb.onrender.com");
            }
            if (obj.sender && obj.sender.profileImageUrl && typeof obj.sender.profileImageUrl === "string" && !isLocal) {
                obj.sender.profileImageUrl = obj.sender.profileImageUrl
                    .replace(/^http:\/\/(localhost:8080|127\.0\.0\.1:\d+)/i, "https://task-manager-backend-fpwb.onrender.com")
                    .replace(/^http:\/\/task-manager-backend-fpwb\.onrender\.com/i, "https://task-manager-backend-fpwb.onrender.com");
            }
            return obj;
        });

        res.status(200).json(cleanedMessages);
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Upload chat file & encrypt
// @route   POST /api/chat/upload
// @access  Private
const uploadChatFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        // Read file buffer
        const fileBuffer = fs.readFileSync(filePath);
        // Encrypt buffer
        const encryptedBuffer = encrypt(fileBuffer);
        // Overwrite file with encrypted data
        fs.writeFileSync(filePath, encryptedBuffer);

        const isLocal = req.get("host")?.includes("localhost") || req.get("host")?.includes("127.0.0.1");
        const protocol = isLocal ? "http" : "https";
        const fileUrl = `${protocol}://${req.get("host")}/api/chat/file/${req.file.filename}`;

        res.status(200).json({
            fileUrl,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            filenameOnDisk: req.file.filename
        });
    } catch (error) {
        console.error("Upload Chat File Error:", error);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

// @desc    Retrieve and decrypt chat file on-the-fly
// @route   GET /api/chat/file/:filename
// @access  Private
const getChatFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, "../uploads/chat-files", filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        // Read encrypted file
        const encryptedBuffer = fs.readFileSync(filePath);
        // Decrypt
        const decryptedBuffer = decrypt(encryptedBuffer);

        // Determine correct content type, fallback to octet-stream
        const ext = path.extname(filename).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".webp") contentType = "image/webp";

        // Set headers for download / view
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.status(200).send(decryptedBuffer);
    } catch (error) {
        console.error("Get Chat File Error:", error);
        res.status(500).json({ message: "Decryption / Retrieval failed", error: error.message });
    }
};

// @desc    Get all custom groups for logged in user
// @route   GET /api/chat/groups
// @access  Private
const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

        // Strictly query groups where the logged in user is either the creator OR a member
        const groups = await Group.find({
            $or: [
                { createdBy: userObjId },
                { createdBy: userId.toString() },
                { members: userObjId },
                { members: userId.toString() }
            ]
        })
        .populate("members", "name email profileImageUrl")
        .populate("createdBy", "name email");

        const formatted = groups.map(g => {
            const id = g.groupId || (g._id ? g._id.toString() : `group_${Date.now()}`);
            const createdById = g.createdBy?._id ? g.createdBy._id.toString() : (g.createdBy ? g.createdBy.toString() : "");
            const members = g.members ? g.members.map(m => m && m._id ? m._id.toString() : (m ? m.toString() : "")).filter(Boolean) : [];

            return {
                id,
                _id: g._id ? g._id.toString() : id,
                name: g.name || "Custom Group",
                createdBy: createdById,
                createdByName: g.createdBy?.name || "User",
                members
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        console.error("Get Groups Error:", error);
        res.status(500).json({ message: "Failed to fetch groups", error: error.message });
    }
};

// @desc    Create a new custom group
// @route   POST /api/chat/groups
// @access  Private
const createGroup = async (req, res) => {
    try {
        const { name, members } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const userId = req.user._id;
        const rawMemberIds = Array.from(new Set([userId.toString(), ...(members || []).map(m => m.toString())]));
        const validMemberObjectIds = rawMemberIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        const groupId = `group_${Date.now()}`;
        const newGroup = await Group.create({
            groupId,
            name: name.trim(),
            createdBy: userId,
            members: validMemberObjectIds
        });

        const formatted = {
            id: newGroup.groupId,
            _id: newGroup._id,
            name: newGroup.name,
            createdBy: userId.toString(),
            members: rawMemberIds
        };

        const io = req.app.get("io");
        if (io) {
            io.emit("group_created", formatted);
        }

        res.status(201).json(formatted);
    } catch (error) {
        console.error("Create Group Error:", error);
        res.status(500).json({ message: "Failed to create group", error: error.message });
    }
};

// @desc    Add or update members in a group
// @route   PUT /api/chat/groups/:groupId/members
// @access  Private
const updateGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members, action } = req.body;

        const group = await Group.findOne({ groupId });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        let updatedMembers = group.members.map(m => m.toString());

        if (action === "add" && Array.isArray(members)) {
            updatedMembers = Array.from(new Set([...updatedMembers, ...members.map(m => m.toString())]));
        } else if (action === "remove" && Array.isArray(members)) {
            updatedMembers = updatedMembers.filter(m => !members.map(id => id.toString()).includes(m));
        } else if (Array.isArray(members)) {
            updatedMembers = Array.from(new Set(members.map(m => m.toString())));
        }

        group.members = updatedMembers
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));
        await group.save();

        const formatted = {
            id: group.groupId,
            _id: group._id,
            name: group.name,
            createdBy: group.createdBy ? group.createdBy.toString() : "",
            members: updatedMembers
        };

        const io = req.app.get("io");
        if (io) {
            io.emit("group_updated", formatted);
        }

        res.status(200).json(formatted);
    } catch (error) {
        console.error("Update Group Members Error:", error);
        res.status(500).json({ message: "Failed to update group members", error: error.message });
    }
};

// @desc    Delete a group
// @route   DELETE /api/chat/groups/:groupId
// @access  Private
const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        await Group.deleteOne({ groupId });

        const io = req.app.get("io");
        if (io) {
            io.emit("group_deleted", { groupId });
        }

        res.status(200).json({ message: "Group deleted successfully", groupId });
    } catch (error) {
        console.error("Delete Group Error:", error);
        res.status(500).json({ message: "Failed to delete group", error: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { senderId } = req.body;
        if (!senderId) {
            return res.status(400).json({ message: "Sender ID is required" });
        }

        await Message.updateMany(
            { sender: senderId, receiver: req.user._id, status: "sent" },
            { $set: { status: "read" } }
        );

        const io = req.app.get("io");
        if (io) {
            io.to(senderId.toString()).emit("messages_read", {
                readerId: req.user._id.toString(),
                senderId: senderId.toString()
            });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { 
    getMessages, 
    uploadChatFile, 
    getChatFile,
    getGroups,
    createGroup,
    updateGroupMembers,
    deleteGroup,
    markAsRead
};
