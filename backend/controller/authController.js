const User = require("../model/User")
const ActivityLog = require("../model/ActivityLog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (UserId) => {
    return jwt.sign({ id: UserId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
    try{
        const { name, email, password, profileImageUrl, adminInviteToken } = req.body;

        // 1. Check for required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide name, email, and password." });
        }

        // Security check: Only allow organization emails (thinklabdigitalsolutions.com)
        const allowedDomain = "@thinklabdigitalsolutions.com";
        const isDeveloper = email.toLowerCase() === "karanam.nagapranav@gmail.com";
        if (!email.toLowerCase().endsWith(allowedDomain) && !isDeveloper) {
            return res.status(400).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are allowed to sign up." });
        }

        const user = await User.findOne({email});
        
        if(user) 
        {
            return res.status(400).json({message:"User with this email already exists"});
        }

        let role="member";
        if(adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN){
            role="admin";
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // NOTE: You are using 'new User()' but you MUST call .save() 
        // OR use 'await User.create()' to save it to the DB.
        const newUser = new User({
            name,
            email,      
            password:hashedPassword,
            profileImageUrl,
            role
        });

        // CRITICAL STEP: Save the new user to the database
        await newUser.save(); 

        await ActivityLog.create({
            user: newUser._id,
            action: "User Registered",
            details: `Registered account for "${newUser.name}"`
        });

        // 2. Respond with token and user data
        res.status(201).json({
            _id:newUser._id,
            name:newUser.name,
            email:newUser.email,
            profileImageUrl:newUser.profileImageUrl,
            role:newUser.role,
            token:generateToken(newUser._id) // This now uses the correct, fixed function
        });
    }catch(err){
        // In a real app, log the error stack: console.error(err.stack);
        res.status(500).json({message:"Server error",error:err.message});
    }
}

// @desc Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;

        // Security check: Only allow organization emails (thinklabdigitalsolutions.com)
        const allowedDomain = "@thinklabdigitalsolutions.com";
        const isDeveloper = email.toLowerCase() === "karanam.nagapranav@gmail.com";
        if (!email.toLowerCase().endsWith(allowedDomain) && !isDeveloper) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        const user = await User.findOne({email});

         if(!user){     
            return res.status(401).json({message:"Invalid email or password"});
            }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid email or password"});
        } 

        await ActivityLog.create({
            user: user._id,
            action: "Login",
            details: `Logged in to the application`
        });

        // Socket Login Notification for Managers/Admins
        const io = req.app.get("io");
        if (io) {
            try {
                if (user.role === "member") {
                    const receivers = await User.find({ role: { $in: ["admin", "manager"] } });
                    receivers.forEach(r => {
                        io.to(r._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "User Logged In",
                            message: `${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                } else if (user.role === "manager") {
                    const admins = await User.find({ role: "admin" });
                    admins.forEach(a => {
                        io.to(a._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "Manager Logged In",
                            message: `Manager ${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                }
            } catch (err) {
                console.error("Socket login notification failed:", err);
            }
        }

        res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            profileImageUrl: user.profileImageUrl || user.profileImageurl || null,
            role:user.role,
            token:generateToken(user._id)
        });

    }catch(err){
        res.status(500).json({message:"Server error",error:err.message});
    }
}    

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private (Requires JWT)
const getUserProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("name email role profileImageUrl createdAt updatedAt");

        if(!user){
            return res.status(404).json({message:"User not found"});
        }   
        const obj = user.toObject();
        obj.profileImageUrl = obj.profileImageUrl || obj.profileImageurl || null;
        delete obj.profileImageurl;
        res.json(obj);
    }catch(err){
        res.status(500).json({message:"Server error",error:err.message});
    }
}

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private (Requires JWT)
const updateUserProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        user.name = req.body.name || user.name;
        if (req.body.profileImageUrl !== undefined) {
            user.profileImageUrl = req.body.profileImageUrl;
        }

        

        if(req.body.password){
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        await ActivityLog.create({
            user: updatedUser._id,
            action: "Profile Updated",
            details: `Updated profile details`
        });

        res.json({
            _id:updatedUser._id,
            name:updatedUser.name,
            email:updatedUser.email,
            profileImageUrl:updatedUser.profileImageUrl,
            role:updatedUser.role,
            token:generateToken(updatedUser._id)
        });

    }catch(err){
        res.status(500).json({message:"Server error",error:err.message});
    }
}

// @desc Google Login
// @route POST /api/auth/google
// @access Public
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Google token is required." });
        }

        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (verificationError) {
            console.error("Token verification failed:", verificationError.message);
            return res.status(401).json({ message: "Invalid Google token.", error: verificationError.message });
        }

        const { email, name, picture } = payload;

        // Security check: Only allow organization emails (thinklabdigitalsolutions.com)
        const allowedDomain = "@thinklabdigitalsolutions.com";
        const isDeveloper = email.toLowerCase() === "karanam.nagapranav@gmail.com";
        if (!email.toLowerCase().endsWith(allowedDomain) && !isDeveloper) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        // Find or create user in our database
        let user = await User.findOne({ email });

        if (!user) {
            // Generate a random password since it's passwordless
            const randomPassword = Math.random().toString(36).slice(-10);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = new User({
                name,
                email,
                password: hashedPassword,
                profileImageUrl: picture,
                role: "member"
            });
            await user.save();
        }

        await ActivityLog.create({
            user: user._id,
            action: "Login",
            details: `Logged in via Google OAuth`
        });

        // Socket Login Notification for Managers/Admins (Google OAuth)
        const io = req.app.get("io");
        if (io) {
            try {
                if (user.role === "member") {
                    const receivers = await User.find({ role: { $in: ["admin", "manager"] } });
                    receivers.forEach(r => {
                        io.to(r._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "User Logged In",
                            message: `${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                } else if (user.role === "manager") {
                    const admins = await User.find({ role: "admin" });
                    admins.forEach(a => {
                        io.to(a._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "Manager Logged In",
                            message: `Manager ${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                }
            } catch (err) {
                console.error("Socket login notification failed:", err);
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl || picture || null,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Redirect to Google OAuth consent page for Calendar scope
// @route   GET /api/auth/google/calendar-init
const initGoogleCalendarAuth = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/calendar-callback`;

    if (!clientId || !clientSecret) {
        return res.status(400).send("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your backend .env file first.");
    }

    const { google } = require("googleapis");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
        ]
    });

    res.redirect(url);
};

// @desc    Callback handler to retrieve Refresh Token for Google Calendar
// @route   GET /api/auth/google/calendar-callback
const googleCalendarCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send("No authorization code received.");
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/calendar-callback`;

        const { google } = require("googleapis");
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const { tokens } = await oauth2Client.getToken(code);
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
            return res.send(`
                <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: auto;">
                    <h2 style="color: #e11d48;">Refresh Token Not Returned</h2>
                    <p>Google did not return a refresh token because this app is already authorized in your account.</p>
                    <p>Please revoke access to this app in your <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a> and try visiting <code>/api/auth/google/calendar-init</code> again.</p>
                </div>
            `);
        }

        const GoogleIntegration = require("../model/GoogleIntegration");
        await GoogleIntegration.findOneAndUpdate(
            {},
            { refreshToken, updatedBy: req.user?._id || null },
            { upsert: true, new: true }
        );

        res.send(`
            <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: auto; border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <h2 style="color: #4f46e5;">Google Calendar Authorized Successfully! 🎉</h2>
                <p style="color: #334155; font-size: 14px;">Google Calendar OAuth integration has been successfully authorized and securely stored on the server.</p>
            </div>
        `);
    } catch (error) {
        console.error("[Google Calendar Auth Callback Error]", error);
        res.status(500).send("Error authorizing Google Calendar: " + error.message);
    }
};


const crypto = require("crypto");
const { sendOtpEmail } = require("../utils/email");

// Helper function to check official organization email domain
const isAllowedDomain = (email) => {
    if (!email || typeof email !== "string") return false;
    const allowedDomain = "@thinklabdigitalsolutions.com";
    const isDeveloper = email.toLowerCase() === "karanam.nagapranav@gmail.com";
    return email.toLowerCase().endsWith(allowedDomain) || isDeveloper;
};

// Helper function to generate cryptographically secure 6-digit random code
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// @desc Request Password Reset OTP
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!isAllowedDomain(email)) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        const user = await User.findOne({ email });
        if (user) {
            const rawOtp = generateOtp();
            const hashedOtp = await bcrypt.hash(rawOtp, 10);
            user.resetOtp = hashedOtp;
            user.resetOtpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
            user.otpAttempts = 0;
            await user.save();

            sendOtpEmail(user.email, user.name, rawOtp, "Password Reset").catch(err => console.error("Email send error:", err.message));
        }

        return res.status(200).json({ message: "OTP sent to your email successfully." });

    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Verify Reset OTP & Reset Password
// @route POST /api/auth/reset-password
// @access Public
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required." });
        }

        if (!isAllowedDomain(email)) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        const user = await User.findOne({ email }).select("+resetOtp +resetOtpExpiry +otpAttempts");

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        if (!user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date() || user.otpAttempts >= 5) {
            if (user.otpAttempts >= 5) {
                user.resetOtp = null;
                user.resetOtpExpiry = null;
                user.otpAttempts = 0;
                await user.save();
            }
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        const isMatch = await bcrypt.compare(otp.toString(), user.resetOtp);
        if (!isMatch) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.resetOtp = null;
                user.resetOtpExpiry = null;
                user.otpAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Reset password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        user.otpAttempts = 0;
        await user.save();

        await ActivityLog.create({
            user: user._id,
            action: "Password Reset",
            details: `Successfully reset account password`
        });

        return res.status(200).json({ message: "Password reset successful. You can now login." });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Request Login OTP
// @route POST /api/auth/login-otp-request
// @access Public
const loginOtpRequest = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!isAllowedDomain(email)) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        const user = await User.findOne({ email });
        if (user) {
            const rawOtp = generateOtp();
            const hashedOtp = await bcrypt.hash(rawOtp, 10);
            user.loginOtp = hashedOtp;
            user.loginOtpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
            user.otpAttempts = 0;
            await user.save();

            sendOtpEmail(user.email, user.name, rawOtp, "OTP Login").catch(err => console.error("Email send error:", err.message));
        }

        return res.status(200).json({ message: "OTP sent to your email successfully." });

    } catch (err) {
        console.error("Login OTP request error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Verify Login OTP & Login
// @route POST /api/auth/login-otp-verify
// @access Public
const loginOtpVerify = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        if (!isAllowedDomain(email)) {
            return res.status(403).json({ message: "Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted." });
        }

        const user = await User.findOne({ email }).select("+loginOtp +loginOtpExpiry +otpAttempts");

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        if (!user.loginOtp || !user.loginOtpExpiry || user.loginOtpExpiry < new Date() || user.otpAttempts >= 5) {
            if (user.otpAttempts >= 5) {
                user.loginOtp = null;
                user.loginOtpExpiry = null;
                user.otpAttempts = 0;
                await user.save();
            }
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        const isMatch = await bcrypt.compare(otp.toString(), user.loginOtp);
        if (!isMatch) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.loginOtp = null;
                user.loginOtpExpiry = null;
                user.otpAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Clear login OTP fields and reset counter
        user.loginOtp = null;
        user.loginOtpExpiry = null;
        user.otpAttempts = 0;
        await user.save();

        await ActivityLog.create({
            user: user._id,
            action: "Login",
            details: `Logged in using OTP`
        });

        // Socket Login Notification for Managers/Admins
        const io = req.app.get("io");
        if (io) {
            try {
                if (user.role === "member") {
                    const receivers = await User.find({ role: { $in: ["admin", "manager"] } });
                    receivers.forEach(r => {
                        io.to(r._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "User Logged In",
                            message: `${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                } else if (user.role === "manager") {
                    const admins = await User.find({ role: "admin" });
                    admins.forEach(a => {
                        io.to(a._id.toString()).emit("notification", {
                            type: "user_login",
                            title: "Manager Logged In",
                            message: `Manager ${user.name} has logged in.`,
                            userId: user._id
                        });
                    });
                }
            } catch (err) {
                console.error("Socket login notification failed:", err);
            }
        }

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImageUrl: user.profileImageUrl || user.profileImageurl || null,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error("Login OTP verify error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};


module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    googleLogin,
    initGoogleCalendarAuth,
    googleCalendarCallback,
    forgotPassword,
    resetPassword,
    loginOtpRequest,
    loginOtpVerify
};


