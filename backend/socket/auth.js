const jwt = require("jsonwebtoken");
const User = require("../model/User");

const socketAuthMiddleware = async (socket, next) => {
    try {
        let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        // Set authenticated user on socket.data
        socket.data.user = user;
        next();
    } catch (error) {
        console.error("[Socket Auth Error]:", error.message);
        next(new Error("Authentication error: Invalid or expired token"));
    }
};

module.exports = socketAuthMiddleware;
