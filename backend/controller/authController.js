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

        const user = await User.findOne({email});
        
        // FIX: Change 'if(userExists)' to 'if(user)'
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
        const user = await User.findById(req.user.id).select("-password");
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
        user.email = req.body.email || user.email;
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

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, googleLogin };


