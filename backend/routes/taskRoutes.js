const express = require("express");
const { getDashboardData, getUserDashboardData, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskCheckList, getTasksForVerification } = require("../controller/taskController");
const { protect, adminOnly, adminOrManager } = require("../middlewares/authMiddleware");
const { decryptText } = require("../utils/encryption");
const mongoose = require("mongoose");
const Task = require("../model/Task");

const router = express.Router();

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// Middleware to decrypt task ID or resolve task slug parameter
router.param("id", async (req, res, next, id) => {
    try {
        // 1. Check if direct valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            req.params.id = id;
            return next();
        }

        // 2. Check if decryptable ObjectId
        try {
            const decrypted = decryptText(id);
            if (mongoose.Types.ObjectId.isValid(decrypted)) {
                req.params.id = decrypted;
                return next();
            }
        } catch (e) {}

        // 3. Find by slug in database
        const taskBySlug = await Task.findOne({ slug: id });
        if (taskBySlug) {
            req.params.id = taskBySlug._id.toString();
            return next();
        }

        // 4. Legacy fallback: generate slug from title and match
        const allTasks = await Task.find();
        const matchingTask = allTasks.find(t => {
            const generated = slugify(t.title || "task") + "-" + t._id.toString().substring(18);
            return generated === id;
        });
        if (matchingTask) {
            req.params.id = matchingTask._id.toString();
            return next();
        }

        return res.status(404).json({ message: "Task not found" });
    } catch (err) {
        res.status(400).json({ message: "Invalid task ID or slug" });
    }
});

router.get("/dashboard-data",protect,getDashboardData);
router.get("/user-dashboard-data",protect,getUserDashboardData);
router.get("/verification",protect,adminOrManager,getTasksForVerification);
router.get("/",protect,getTasks);
router.get("/:id",protect,getTaskById);
router.post("/",protect,adminOrManager,createTask);
router.put("/:id",protect,updateTask);
router.delete("/:id",protect,adminOrManager,deleteTask);
router.put("/:id/status",protect,updateTaskStatus);
router.put("/:id/todo",protect,updateTaskCheckList);

module.exports = router;   