const rateLimit = require("express-rate-limit");

// Strict rate limiter for sensitive authentication endpoints (5 requests per 15 mins per IP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: "Too many authentication attempts, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Looser global rate limiter for general API routes (100 requests per 15 mins per IP)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    globalLimiter
};
