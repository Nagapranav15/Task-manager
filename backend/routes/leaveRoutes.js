const express = require("express");
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require("../controller/leaveController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

router.post("/", protect, applyLeave);
router.get("/", protect, getLeaves);
router.put("/:id/status", protect, adminOnly, updateLeaveStatus);

module.exports = router;
