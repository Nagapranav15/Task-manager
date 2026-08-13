const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const Message = require("../model/Message");
const Group = require("../model/Group");
const { verifyFileSignature } = require("../utils/fileSigner");

const uploadsDir = path.resolve(__dirname, "../uploads");

const serveAuthenticatedFile = async (req, res) => {
    try {
        let rawPath = req.path || "";
        let decodedPath;

        try {
            decodedPath = decodeURIComponent(rawPath);
        } catch (e) {
            return res.status(400).json({ message: "Invalid file path" });
        }

        // Path Traversal Security Checks
        if (
            decodedPath.includes("..") ||
            decodedPath.includes("\0") ||
            rawPath.toLowerCase().includes("%2f") ||
            rawPath.toLowerCase().includes("%5c")
        ) {
            return res.status(400).json({ message: "Invalid file path" });
        }

        const relativePath = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
        const filename = path.basename(relativePath);

        // Enforce strict filename characters
        if (!filename || !/^[\w.\-]+$/.test(filename)) {
            return res.status(400).json({ message: "Invalid file path" });
        }

        const targetPath = path.resolve(uploadsDir, relativePath);
        if (!targetPath.startsWith(uploadsDir)) {
            return res.status(400).json({ message: "Invalid file path" });
        }

        // 1. Authenticate user via Bearer JWT or Signed URL query parameters
        let user = null;
        let token = req.headers.authorization || req.query.token;

        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
                user = await User.findById(decoded.id).select("name email role");
            } catch (err) {
                // Token invalid/expired
            }
        }

        // Check short-lived HMAC signed URL parameters if JWT token failed or absent
        if (!user && req.query.sig && req.query.exp && req.query.uid) {
            const isValidSig = verifyFileSignature(req.originalUrl.split("?")[0], req.query.sig, req.query.exp, req.query.uid);
            if (isValidSig) {
                user = await User.findById(req.query.uid).select("name email role");
            }
        }

        if (!user) {
            return res.status(401).json({ message: "Not authorized to access file" });
        }

        // 2. Conversation Access Control for Chat Attachments
        if (relativePath.startsWith("chat-files/")) {
            const msg = await Message.findOne({ "attachments.url": { $regex: filename } });

            if (msg && msg.conversation) {
                const currentUserIdStr = user._id.toString();

                if (msg.conversation.type === "dm") {
                    const senderId = msg.sender ? msg.sender.toString() : null;
                    const peerId = msg.conversation.peer ? msg.conversation.peer.toString() : null;

                    if (currentUserIdStr !== senderId && currentUserIdStr !== peerId) {
                        return res.status(403).json({ message: "Access denied to chat attachment" });
                    }
                } else if (msg.conversation.type === "group") {
                    const group = await Group.findOne({
                        _id: msg.conversation.group,
                        "participants.user": user._id,
                        isDeleted: { $ne: true }
                    });

                    if (!group) {
                        return res.status(403).json({ message: "Access denied to chat attachment" });
                    }
                }
            }
        }

        // 3. File existence check and streaming
        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ message: "File not found" });
        }

        return res.sendFile(targetPath);
    } catch (error) {
        console.error("File Serving Error:", error);
        return res.status(500).json({ message: "Server error serving file" });
    }
};

module.exports = { serveAuthenticatedFile };
