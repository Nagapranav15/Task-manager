const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getActivities } = require("../controller/activityController");

router.get("/", protect, getActivities);

module.exports = router;
