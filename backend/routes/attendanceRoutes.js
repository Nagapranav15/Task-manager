const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
    clockIn,
    clockOut,
    getMyLogs,
    adminGetAllLogs,
    adminUpdateLog,
    adminExportLogs,
    adminDeleteOldLogs
} = require("../controller/attendanceController");

router.post("/clock-in", protect, clockIn);
router.post("/clock-out", protect, clockOut);
router.get("/my-logs", protect, getMyLogs);
router.get("/admin/all-logs", protect, adminOnly, adminGetAllLogs);
router.get("/admin/export", protect, adminOnly, adminExportLogs);
router.delete("/admin/delete-old", protect, adminOnly, adminDeleteOldLogs);
router.put("/admin/log/:id", protect, adminOnly, adminUpdateLog);

module.exports = router;
