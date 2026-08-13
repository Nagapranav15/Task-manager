const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
    requireGroupMember,
    requireGroupAdmin,
    requireGroupOwner
} = require("../middlewares/groupMiddleware");

const {
    getMessages,
    uploadChatFile,
    getChatMedia,
    searchChat,
    getChatStates,
    updateChatState
} = require("../controller/chatController");

const {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    addParticipants,
    removeParticipant,
    promoteParticipant,
    demoteParticipant,
    leaveGroup,
    updateSettings,
    createInviteCode,
    revokeInviteCode,
    joinByInviteCode,
    deleteGroup
} = require("../controller/groupController");

const { chatUpload } = require("../middlewares/chatUploadMiddleware");

// Chat messages & media routes
router.get("/messages", protect, getMessages);
router.post("/upload", protect, chatUpload.single("file"), uploadChatFile);
router.get("/media", protect, getChatMedia);
router.get("/search", protect, searchChat);
router.get("/state", protect, getChatStates);
router.patch("/state", protect, updateChatState);

// Group lifecycle & management routes under /api/chat/groups
router.post("/groups", protect, createGroup);
router.get("/groups", protect, getGroups);
router.post("/groups/join/:inviteCode", protect, joinByInviteCode);

router.get("/groups/:id", protect, requireGroupMember, getGroupById);
router.patch("/groups/:id", protect, requireGroupMember, updateGroup);
router.post("/groups/:id/participants", protect, requireGroupMember, addParticipants);
router.delete("/groups/:id/participants/:userId", protect, requireGroupMember, removeParticipant);

router.post("/groups/:id/participants/:userId/promote", protect, requireGroupAdmin, promoteParticipant);
router.post("/groups/:id/participants/:userId/demote", protect, requireGroupAdmin, demoteParticipant);
router.post("/groups/:id/leave", protect, requireGroupMember, leaveGroup);

router.patch("/groups/:id/settings", protect, requireGroupAdmin, updateSettings);
router.post("/groups/:id/invite", protect, requireGroupAdmin, createInviteCode);
router.delete("/groups/:id/invite", protect, requireGroupAdmin, revokeInviteCode);

router.delete("/groups/:id", protect, requireGroupOwner, deleteGroup);

module.exports = router;
