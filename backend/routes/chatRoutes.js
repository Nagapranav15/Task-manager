const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { 
    getMessages, 
    uploadChatFile, 
    getChatFile,
    getGroups,
    createGroup,
    updateGroupMembers,
    deleteGroup
} = require("../controller/chatController");
const { chatUpload } = require("../middlewares/chatUploadMiddleware");

router.get("/messages", protect, getMessages);
router.post("/upload", protect, chatUpload.single("file"), uploadChatFile);
router.get("/file/:filename", protect, getChatFile);

// Group management routes
router.get("/groups", protect, getGroups);
router.post("/groups", protect, createGroup);
router.put("/groups/:groupId/members", protect, updateGroupMembers);
router.delete("/groups/:groupId", protect, deleteGroup);

module.exports = router;
