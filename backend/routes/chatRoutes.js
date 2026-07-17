const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getMessages, uploadChatFile, getChatFile } = require("../controller/chatController");
const { chatUpload } = require("../middlewares/chatUploadMiddleware");

router.get("/messages", protect, getMessages);
router.post("/upload", protect, chatUpload.single("file"), uploadChatFile);
router.get("/file/:filename", protect, getChatFile);

module.exports = router;
