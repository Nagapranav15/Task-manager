require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");  
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes"); 
const reportRoutes = require("./routes/reportRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const activityRoutes = require("./routes/activityRoutes");
const chatRoutes = require("./routes/chatRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const compression = require("compression");

const app = express();
app.set("trust proxy", 1);

app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    })
);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(compression());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 25e6, // 25MB payload limit for attachments and images
});

// Store io instance in express app for access in controllers
app.set("io", io);

const onlineUsersMap = new Map();

io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    const broadcastOnlineUsers = () => {
        const activeIds = [];
        const statuses = {};
        for (const [, info] of onlineUsersMap.entries()) {
            if (info && info.userId) {
                activeIds.push(info.userId);
                statuses[info.userId] = info.status || "online";
            }
        }
        io.emit("update_online_users", { activeIds: Array.from(new Set(activeIds)), statuses });
    };
    
    // Join room based on User ID for targeted push notifications
    socket.on("join", (userId) => {
        if (userId && userId !== "undefined" && userId !== "null" && userId.toString().trim() !== "") {
            const cleanId = userId.toString().trim();
            socket.join(cleanId);
            const current = onlineUsersMap.get(socket.id) || {};
            onlineUsersMap.set(socket.id, { userId: cleanId, status: current.status || "online" });
            broadcastOnlineUsers();
            console.log(`[Socket] User ${cleanId} joined their notification room.`);
        }
    });

    socket.on("user_online", (userId) => {
        if (userId && userId !== "undefined" && userId !== "null" && userId.toString().trim() !== "") {
            const cleanId = userId.toString().trim();
            socket.join(cleanId);
            const current = onlineUsersMap.get(socket.id) || {};
            onlineUsersMap.set(socket.id, { userId: cleanId, status: current.status || "online" });
            broadcastOnlineUsers();
            console.log(`[Socket] User ${cleanId} joined notification room via user_online.`);
        }
    });

    socket.on("update_my_status", ({ userId, status }) => {
        if (userId && userId !== "undefined" && userId !== "null" && userId.toString().trim() !== "") {
            const cleanId = userId.toString().trim();
            socket.join(cleanId);
            onlineUsersMap.set(socket.id, { userId: cleanId, status: status || "online" });
            broadcastOnlineUsers();
        }
    });

    // Unified chat message listener for chat_message, send_message, and send_group_message
    const handleIncomingMessage = async (data) => {
        try {
            const Message = require("./model/Message");
            const senderId = data.senderId || data.sender;
            const receiverId = data.targetUserId || data.receiverId || data.receiver || null;
            let groupName = data.group || data.groupChatId || "";

            if (!senderId) {
                console.error("[Socket] Missing senderId in chat payload:", data);
                return;
            }

            let finalGroup = groupName;
            if (receiverId) {
                finalGroup = "";
            } else if (!finalGroup || finalGroup === "general_group") {
                finalGroup = "general";
            }

            const newMsg = await Message.create({
                sender: senderId,
                receiver: receiverId || null,
                group: finalGroup,
                text: data.text || "",
                fileUrl: data.fileUrl || "",
                fileName: data.fileName || "",
                fileType: data.fileType || ""
            });

            // Populate sender details
            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl role");

            // Attach compatibility payload properties
            const msgObj = populatedMsg.toObject();
            msgObj.groupChatId = finalGroup === "general" ? "general_group" : finalGroup;

            if (msgObj.fileUrl && typeof msgObj.fileUrl === "string") {
                msgObj.fileUrl = msgObj.fileUrl
                    .replace(/^http:\/\/(localhost:8080|127\.0\.0\.1:\d+)/i, "https://task-manager-backend-fpwb.onrender.com")
                    .replace(/^http:\/\/task-manager-backend-fpwb\.onrender\.com/i, "https://task-manager-backend-fpwb.onrender.com");
            }
            if (msgObj.sender && msgObj.sender.profileImageUrl && typeof msgObj.sender.profileImageUrl === "string") {
                msgObj.sender.profileImageUrl = msgObj.sender.profileImageUrl
                    .replace(/^http:\/\/(localhost:8080|127\.0\.0\.1:\d+)/i, "https://task-manager-backend-fpwb.onrender.com")
                    .replace(/^http:\/\/task-manager-backend-fpwb\.onrender\.com/i, "https://task-manager-backend-fpwb.onrender.com");
            }

            // Broadcast to targeted user rooms for direct messages, or all for groups
            const isDM = receiverId && 
                         receiverId !== "undefined" && 
                         receiverId !== "null" && 
                         receiverId.toString().trim() !== "" &&
                         /^[0-9a-fA-F]{24}$/.test(receiverId.toString().trim());

            if (isDM) {
                const rRoom = receiverId.toString().trim();
                const sRoom = senderId.toString().trim();
                io.to(rRoom).emit("chat_message", msgObj);
                io.to(rRoom).emit("receive_message", msgObj);
                if (sRoom !== rRoom) {
                    io.to(sRoom).emit("chat_message", msgObj);
                    io.to(sRoom).emit("receive_message", msgObj);
                }
            } else {
                io.emit("chat_message", msgObj);
                io.emit("receive_message", msgObj);
            }
        } catch (error) {
            console.error("[Socket] Failed to process message:", error);
        }
    };

    socket.on("chat_message", handleIncomingMessage);

    socket.on("disconnect", () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
        onlineUsersMap.delete(socket.id);
        broadcastOnlineUsers();
    });
});

//Connect database
connectDB();

// Middleware
app.use(express.json());

// Add this after app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Task Manager API is running!', 
        port: process.env.PORT || 8080 
    });
});

app.get('/health', (req, res) => {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        database: dbStatus,
        timestamp: new Date()
    });
});


//Routes
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));

//Server upload images
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: '30d' }));

//Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});