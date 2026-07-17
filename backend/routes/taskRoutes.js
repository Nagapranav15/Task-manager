const express = require("express");
const { getDashboardData, getUserDashboardData, getTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskCheckList } = require("../controller/taskController");
const { protect, adminOnly, adminOrManager } = require("../middlewares/authMiddleware");



const router = express.Router();

router.get("/dashboard-data",protect,getDashboardData);
router.get("/user-dashboard-data",protect,getUserDashboardData);
router.get("/",protect,getTasks);
router.get("/:id",protect,getTaskById);
router.post("/",protect,adminOrManager,createTask);
router.put("/:id",protect,updateTask);
router.delete("/:id",protect,adminOrManager,deleteTask);
router.put("/:id/status",protect,updateTaskStatus);
router.put("/:id/todo",protect,updateTaskCheckList);

module.exports = router;   