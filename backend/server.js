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

const app=express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    }
});

// Store io instance in express app for access in controllers
app.set("io", io);

io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    
    // Join room based on User ID for targeted push notifications
    socket.on("join", (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`[Socket] User ${userId} joined their notification room.`);
        }
    });

    // Listen to incoming chat messages
    socket.on("chat_message", async (data) => {
        try {
            const Message = require("./model/Message");
            const newMsg = await Message.create({
                sender: data.senderId,
                receiver: data.receiverId || null,
                group: data.group || "",
                text: data.text || "",
                fileUrl: data.fileUrl || "",
                fileName: data.fileName || "",
                fileType: data.fileType || ""
            });

            // Populate sender details
            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

            // Broadcast message
            if (data.group) {
                io.emit("chat_message", populatedMsg);
            } else if (data.receiverId) {
                io.to(data.receiverId.toString()).emit("chat_message", populatedMsg);
                io.to(data.senderId.toString()).emit("chat_message", populatedMsg);
            }
        } catch (error) {
            console.error("[Socket] Failed to process message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});

//Middleware to handle CORS
const allowedOrigins = [
    "https://task-manager-topaz-pi.vercel.app",
    "https://tasks-tracker.thinklabdigitalsolutions.com"
];

if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5173", "http://localhost:3000", "http://localhost:8080");
}

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders: ["Content-Type","Authorization"],
    })
);

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

//Server upload images
app.use("/uploads",express.static(path.join(__dirname,"uploads")));

//Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});