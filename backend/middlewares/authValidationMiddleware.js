const validateAuthRequest = (req, res, next) => {
    const routePath = req.path || "";
    const body = req.body || {};

    if (routePath.endsWith("/register")) {
        const { name, email, password } = body;
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Please provide a valid name." });
        }
        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ message: "Please provide a valid email." });
        }
        if (!password || typeof password !== "string") {
            return res.status(400).json({ message: "Please provide a valid password." });
        }
    } else if (routePath.endsWith("/login")) {
        const { email, password } = body;
        if (!email || typeof email !== "string" || !email.trim() || !password || typeof password !== "string") {
            return res.status(400).json({ message: "Please provide email and password." });
        }
    } else if (routePath.endsWith("/google")) {
        const { token } = body;
        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({ message: "Google token is required." });
        }
    } else if (routePath.endsWith("/forgot-password") || routePath.endsWith("/login-otp-request")) {
        const { email } = body;
        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ message: "Email is required." });
        }
    } else if (routePath.endsWith("/reset-password")) {
        const { email, otp, newPassword } = body;
        if (!email || typeof email !== "string" || !email.trim() || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required." });
        }
    } else if (routePath.endsWith("/login-otp-verify")) {
        const { email, otp } = body;
        if (!email || typeof email !== "string" || !email.trim() || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }
    }

    next();
};

module.exports = { validateAuthRequest };
