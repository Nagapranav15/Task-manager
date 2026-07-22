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
        const processFile = () => {
            const uploadedFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
            if (!uploadedFile) {
                return res.status(400).json({ message: "No file uploaded." });
            }
            const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
            const host = req.headers["x-forwarded-host"] || req.get("host");
            const imageUrl = `${protocol}://${host}/uploads/${uploadedFile.filename}`;
            return res.status(200).json({ imageUrl });
        };

        if (err) {
            console.error("[Upload Image Error]:", err);
            return res.status(400).json({ message: err.message || "File upload failed." });
        }
        return processFile();
    });
});

module.exports = router;