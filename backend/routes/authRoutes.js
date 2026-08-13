const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile, googleLogin, initGoogleCalendarAuth, googleCalendarCallback, forgotPassword, resetPassword, loginOtpRequest, loginOtpVerify } = require("../controller/authController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Auth routes
router.post("/register", registerUser);              // Register user
router.post("/login", loginUser);                    // Login user
router.post("/google", googleLogin);                // Google OAuth Login
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login-otp-request", loginOtpRequest);
router.post("/login-otp-verify", loginOtpVerify);
router.get("/google/calendar-init", protect, adminOnly, initGoogleCalendarAuth);
router.get("/google/calendar-callback", protect, adminOnly, googleCalendarCallback);
router.get("/profile", protect, getUserProfile);    // Get user profile
router.put("/profile", protect, updateUserProfile); // Update user profile



router.post("/upload-image", protect, (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ 
                message: err.message || "File upload failed.", 
                error: err.toString(),
                code: err.code
            });
        }

        const uploadedFile = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
        if (!uploadedFile) {
            return res.status(400).json({ 
                message: "No file uploaded.", 
                details: "Multer was unable to parse file from the 'image' field."
            });
        }

        const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const imageUrl = `${protocol}://${host}/uploads/avatars/${uploadedFile.filename}`;
        return res.status(200).json({ imageUrl });
    });
});


module.exports = router;