const Message = require("../model/Message");
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
            if (group === "general" || group === "general_group" || group === "") {
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

        res.status(200).json(messages);
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

        const fileUrl = `${req.protocol}://${req.get("host")}/api/chat/file/${req.file.filename}`;

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

module.exports = { getMessages, uploadChatFile, getChatFile };
