const express = require("express");
const { createMeeting, getMeetings, updateMeeting, deleteMeeting } = require("../controller/meetingController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createMeeting);
router.get("/", protect, getMeetings);
router.put("/:id", protect, updateMeeting);
router.delete("/:id", protect, deleteMeeting);

module.exports = router;
