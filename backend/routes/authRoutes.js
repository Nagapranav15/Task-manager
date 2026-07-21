const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile, googleLogin, initGoogleCalendarAuth, googleCalendarCallback } = require("../controller/authController");
const { protect } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Auth routes
router.post("/register", registerUser);              // Register user
router.post("/login", loginUser);                    // Login user
router.post("/google", googleLogin);                // Google OAuth Login
router.get("/google/calendar-init", initGoogleCalendarAuth);
router.get("/google/calendar-callback", googleCalendarCallback);
router.get("/profile", protect, getUserProfile);    // Get user profile
router.put("/profile", protect, updateUserProfile); // Update user profile

router.post("/upload-image", (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error("[Upload Image Error]:", err);
            return res.status(400).json({ message: err.message || "File upload error." });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || "https";
        const imageUrl = `${protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        res.status(200).json({ imageUrl });
    });
});

module.exports = router;