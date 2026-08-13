const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../model/User");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret_key", { expiresIn: "7d" });
};

const createTestUser = async (role = "member", extraFields = {}) => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    const domain = "thinklabdigitalsolutions.com";
    const email = extraFields.email || `user_${timestamp}_${Math.random().toString(36).substring(7)}@${domain}`;
    const name = extraFields.name || `Test User ${timestamp}`;
    const rawPassword = extraFields.password || "Password123!";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        ...extraFields
    });

    const token = generateToken(user._id);
    return { user, token, rawPassword };
};

const withAuth = (req, token) => {
    if (token) {
        req.set("Authorization", `Bearer ${token}`);
    }
    return req;
};

const assertNoSensitiveUserFields = (data) => {
    if (!data) return;
    const targets = Array.isArray(data) ? data : [data];

    for (const item of targets) {
        if (typeof item === "object" && item !== null) {
            expect(item.password).toBeUndefined();
            expect(item.loginOtp).toBeUndefined();
            expect(item.resetOtp).toBeUndefined();
            expect(item.loginOtpExpiry).toBeUndefined();
            expect(item.resetOtpExpiry).toBeUndefined();
            expect(item.otpAttempts).toBeUndefined();
        }
    }
};

module.exports = {
    generateToken,
    createTestUser,
    withAuth,
    assertNoSensitiveUserFields
};
