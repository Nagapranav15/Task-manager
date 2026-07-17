const express = require("express");
const { exportTaskReport, exportUsersReport } = require("../controller/reportController");
const { protect, adminOnly, adminOrManager } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/export/tasks", protect, adminOrManager, exportTaskReport);
router.get("/export/users", protect, adminOrManager, exportUsersReport);

module.exports = router;