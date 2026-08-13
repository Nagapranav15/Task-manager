// Restart comment to sync nodemon task verification route additions
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

// Initialize modular authenticated Socket.IO handlers
const initSocketIO = require("./socket");
initSocketIO(io);


//Connect database
connectDB();

// Middleware
const { globalLimiter } = require("./middlewares/rateLimiter");
app.use("/api", globalLimiter);
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

// Server upload images (Authenticated & Access Controlled)
const { serveAuthenticatedFile } = require("./middlewares/fileAuthMiddleware");
app.use("/uploads", serveAuthenticatedFile);


//Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});