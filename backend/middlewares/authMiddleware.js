const jwt = require("jsonwebtoken");
const User = require("../model/User");
// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization || req.query.token;

        if (token) {
            if (token.startsWith("Bearer ")) {
                token = token.split(" ")[1]; // Extract token
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password"); 
            next();
        } else {
            res.status(401).json({ message: "Not authorized, no token" });
        }
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(401).json({ message: "Not authorized, token failed", error: error.message });
    }
};

//Middleware to restrict access based on user roles
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();         
    } else {
        res.status(403).json({ message: "Access denied, admin only" });
    }
};

const adminOrManager = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "manager")) {
        next();
    } else {
        res.status(403).json({ message: "Access denied, admin or manager only" });
    }
};

module.exports = { protect, adminOnly, adminOrManager };
    