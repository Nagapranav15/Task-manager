require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");  
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes"); 
const reportRoutes = require("./routes/reportRoutes");

const app=express();



//Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    })
)

//Connect database
connectDB();

// Middleware
app.use(express.json());

// Add this after app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Task Manager API is running!', 
        port: 8080 
    });
});


//Routes
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/reports",reportRoutes);

//Server upload images
app.use("/uploads",express.static(path.join(__dirname,"uploads")));

//Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});