const express = require("express");
const router = express.Router();
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require("../controller/holidayController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

router.get("/", protect, getHolidays);
router.post("/", protect, adminOnly, createHoliday);
router.put("/:id", protect, adminOnly, updateHoliday);
router.delete("/:id", protect, adminOnly, deleteHoliday);

module.exports = router;
