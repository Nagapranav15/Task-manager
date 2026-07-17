const Task = require("../model/Task");
const ActivityLog = require("../model/ActivityLog");

//@desc    Get all tasks(Admin: all, User: Only assigned)
//@route   GET /api/tasks
//@access  Private  
const getTasks = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) filter.status = status;

        let tasks;
        if (req.user.role === "admin" || req.user.role === "manager") {
            tasks = await Task.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        } else {
            tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        }

        // Add completed checklist count
        tasks = tasks.map(task => {
            const completedCount = task.todochecklist.filter(item => item.completed).length;
            return { ...task._doc, completedTodoCount: completedCount };
        });

        const allTask = await Task.countDocuments(
            (req.user.role === "admin" || req.user.role === "manager") ? {} : { assignedTo: req.user._id }
        );

        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...((req.user.role !== "admin" && req.user.role !== "manager") && { assignedTo: req.user._id }),
        });

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...((req.user.role !== "admin" && req.user.role !== "manager") && { assignedTo: req.user._id }),
        });

        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...((req.user.role !== "admin" && req.user.role !== "manager") && { assignedTo: req.user._id }),
        });

        res.status(200).json({
            tasks,
            statusSummary: {
                all: allTask,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc    Get task by ID   
//@route   GET /api/tasks/:id
//@access  Private  
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//@desc    Create a new task(Admin only )
//@route   POST /api/tasks
//@access  Private/Admin  
//@desc    Create a new task(Admin only )
//@route   POST /api/tasks
//@access  Private/Admin  
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            todochecklist,
            attachments
        } = req.body;

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
        }

        // Accept both todochecklist and todoCheckList keys from client
        const incomingChecklist = req.body.todochecklist || req.body.todoCheckList || [];

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todochecklist: incomingChecklist,
            attachments
        });

        // Notify assigned users about task assignment
        const populatedTask = await Task.findById(task._id).populate("assignedTo", "name email");
        if (populatedTask && populatedTask.assignedTo) {
            const { sendTaskAssignmentEmail } = require("../utils/email");
            for (const user of populatedTask.assignedTo) {
                if (user.email) {
                    await sendTaskAssignmentEmail(user.email, user.name, populatedTask.title, populatedTask.priority, populatedTask.dueDate);
                }
            }
        }

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Task Created",
            details: `Created task "${task.title}"`,
            task: task._id
        });

        // Socket Notification & Automated Chat Message
        const io = req.app.get("io");
        const Message = require("../model/Message");

        if (io) {
            task.assignedTo.forEach((userId) => {
                io.to(userId.toString()).emit("notification", {
                    type: "task_assigned",
                    title: "New Task Assigned",
                    message: `You have been assigned a new task: "${task.title}"`,
                    task: task
                });
            });
        }

        const formattedDate = new Date(task.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        // Send details to each assigned user in chat
        for (const userId of task.assignedTo) {
            const taskText = `📋 **New Task Assigned!**\n\n**Title**: ${task.title}\n**Priority**: ${task.priority}\n**Due Date**: ${formattedDate}\n\n*Check your dashboard or tasks page for full details.*`;
            
            const newMsg = await Message.create({
                sender: req.user._id,
                receiver: userId,
                group: "",
                text: taskText
            });

            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");
            
            if (io) {
                io.to(userId.toString()).emit("chat_message", populatedMsg);
                io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
            }
        }

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc    Update a task
//@route   PUT /api/tasks/:id
//@access  Private  
const updateTask = async (req, res) => {
    try {
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    // Optional role check (safe ObjectId comparison)
    if (
        req.user.role !== "admin" &&
        req.user.role !== "manager" &&
        !task.assignedTo.some((userId) => userId.toString() === req.user._id.toString())
    ) {
        return res.status(403).json({ message: "Access denied" });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    // Accept both todochecklist and todoCheckList from client
    const incomingChecklist =
        req.body.todochecklist || req.body.todoCheckList || task.todochecklist;
    task.todochecklist = incomingChecklist;
    task.attachments = req.body.attachments || task.attachments;

    if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
        }
        task.assignedTo = req.body.assignedTo;
    }

    // Recalculate progress and status if checklist updated
    if (Array.isArray(task.todochecklist)) {
        const completedCount = task.todochecklist.filter((item) => item.completed).length;
        const totalItems = task.todochecklist.length;
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }
    }

    const updatedTask = await task.save();

    await ActivityLog.create({
        user: req.user._id,
        action: "Task Updated",
        details: `Updated task "${updatedTask.title}"`,
        task: updatedTask._id
    });

    // Notify creator if task status is completed
    if (updatedTask.status === "Completed" && updatedTask.createdBy && updatedTask.createdBy.toString() !== req.user._id.toString()) {
        const Message = require("../model/Message");
        const completeText = `✅ **Task Completed!**\n\nI have marked the task **"${updatedTask.title}"** as completed. Please review it.`;
        
        const newMsg = await Message.create({
            sender: req.user._id,
            receiver: updatedTask.createdBy,
            group: "",
            text: completeText
        });

        const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");
        const io = req.app.get("io");
        if (io) {
            io.to(updatedTask.createdBy.toString()).emit("chat_message", populatedMsg);
            io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
            io.to(updatedTask.createdBy.toString()).emit("notification", {
                type: "task_completed",
                title: "Task Completed",
                message: `${req.user.name} completed the task: "${updatedTask.title}"`,
                task: updatedTask
            });
        }
    }

    // Send details to each assigned user in chat when updated by admin/manager/creator
    if (req.user.role === "admin" || req.user.role === "manager" || updatedTask.createdBy?.toString() === req.user._id.toString()) {
        const Message = require("../model/Message");
        const io = req.app.get("io");
        const formattedDate = new Date(updatedTask.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        
        for (const userId of updatedTask.assignedTo) {
            const updateText = `✏️ **Task Updated!**\n\n**Title**: ${updatedTask.title}\n**Priority**: ${updatedTask.priority}\n**Status**: ${updatedTask.status}\n**Due Date**: ${formattedDate}\n\n*Please review the updated task details.*`;
            
            const newMsg = await Message.create({
                sender: req.user._id,
                receiver: userId,
                group: "",
                text: updateText
            });

            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");
            
            if (io) {
                io.to(userId.toString()).emit("chat_message", populatedMsg);
                io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
                io.to(userId.toString()).emit("notification", {
                    type: "task_updated",
                    title: "Task Updated",
                    message: `The task "${updatedTask.title}" has been updated.`,
                    task: updatedTask
                });
            }
        }
    }

    res.json({ message: "Task updated successfully", task: updatedTask });

} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
}
};

//@desc    Delete a task(Admin only )
//@route   DELETE /api/tasks/:id
//@access  Private(Admin) 
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        // Notify assigned users in chat before deleting
        if (task.assignedTo && task.assignedTo.length > 0) {
            const Message = require("../model/Message");
            const io = req.app.get("io");
            
            for (const userId of task.assignedTo) {
                const deleteText = `🗑️ **Task Deleted!**\n\nThe task **"${task.title}"** assigned to you has been deleted/cancelled by the admin.`;
                
                const newMsg = await Message.create({
                    sender: req.user._id,
                    receiver: userId,
                    group: "",
                    text: deleteText
                });

                const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");
                
                if (io) {
                    io.to(userId.toString()).emit("chat_message", populatedMsg);
                    io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
                    io.to(userId.toString()).emit("notification", {
                        type: "task_deleted",
                        title: "Task Deleted",
                        message: `The task "${task.title}" has been deleted.`,
                        task: null
                    });
                }
            }
        }

        await ActivityLog.create({
            user: req.user._id,
            action: "Task Deleted",
            details: `Deleted task "${task.title}"`
        });
        await task.deleteOne();
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//@desc    Update task status
//@route   PUT /api/tasks/:id/status
//@access  Private  
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const isAssigned = task.assignedTo.some(
            userId => userId.toString() === req.user._id.toString()
        );
        if (req.user.role !== "admin" && req.user.role !== "manager" && !isAssigned) {
            return res.status(403).json({ message: "Not Authorized" });
        }
        task.status = req.body.status || task.status;
        
        if (task.status === "Completed") {
            task.todochecklist.forEach((item) => (item.completed = true));
            task.progress = 100;
        }   
        await task.save();

        // Notify assigned users about status update
        const populatedTask = await Task.findById(task._id).populate("assignedTo", "name email");
        if (populatedTask && populatedTask.assignedTo) {
            const { sendTaskStatusUpdateEmail } = require("../utils/email");
            for (const user of populatedTask.assignedTo) {
                if (user.email) {
                    await sendTaskStatusUpdateEmail(user.email, user.name, populatedTask.title, populatedTask.status);
                }
            }
        }

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Status Updated",
            details: `Updated status of "${task.title}" to "${task.status}"`,
            task: task._id
        });

        // Socket Notification & Auto Chat Update
        const io = req.app.get("io");
        if (io) {
            // Notify creator/admin if completed
            if (task.status === "Completed" && task.createdBy) {
                io.to(task.createdBy.toString()).emit("notification", {
                    type: "task_completed",
                    title: "Task Completed",
                    message: `${req.user.name} completed the task: "${task.title}"`,
                    task: task
                });
            }
            // Notify all assignees
            task.assignedTo.forEach((userId) => {
                if (userId.toString() !== req.user._id.toString()) {
                    io.to(userId.toString()).emit("notification", {
                        type: "task_updated",
                        title: "Task Status Updated",
                        message: `Task "${task.title}" status was updated to: "${task.status}"`,
                        task: task
                    });
                }
            });
        }

        // Auto Chat Message if completed
        if (task.status === "Completed" && task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
            const Message = require("../model/Message");
            const completeText = `✅ **Task Completed!**\n\nI have marked the task **"${task.title}"** as completed. Please review it.`;
            
            const newMsg = await Message.create({
                sender: req.user._id,
                receiver: task.createdBy,
                group: "",
                text: completeText
            });

            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

            if (io) {
                io.to(task.createdBy.toString()).emit("chat_message", populatedMsg);
                io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
            }
        }

        res.json({ message: "Task status updated", task });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//@desc    Update task checklist
//@route   PUT /api/tasks/:id/todo
//@access  Private  
const updateTaskCheckList = async (req, res) => {
    try {
        const { todochecklist } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const isAssigned = task.assignedTo.some((userId) => userId.toString() === req.user._id.toString());
        if (!isAssigned && req.user.role !== "admin" && req.user.role !== "manager") {
            return res.status(403).json({ message: "Not Authorized to update checklist" });
        }
        task.todochecklist = todochecklist;

        const completedCount = todochecklist.filter((item) => item.completed).length;
        const totalItems = task.todochecklist.length;
        task.progress=totalItems>0?Math.round((completedCount / totalItems) * 100):0;     

        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress";
        } else {
            task.status = "Pending";
        }
        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Checklist Updated",
            details: `Updated checklist items on "${task.title}" (Progress: ${task.progress}%, Status: ${task.status})`,
            task: task._id
        });

        // Socket Notification & Auto Chat Update
        const io = req.app.get("io");
        if (io) {
            // Notify all other assignees about progress update
            task.assignedTo.forEach((userId) => {
                if (userId.toString() !== req.user._id.toString()) {
                    io.to(userId.toString()).emit("notification", {
                        type: "task_progress",
                        title: "Task Progress Updated",
                        message: `Checklist items on "${task.title}" were toggled. Progress: ${task.progress}%`,
                        task: task
                    });
                }
            });

            // Notify creator/admin if completed
            if (task.status === "Completed" && task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
                io.to(task.createdBy.toString()).emit("notification", {
                    type: "task_completed",
                    title: "Task Completed",
                    message: `${req.user.name} completed the task: "${task.title}"`,
                    task: task
                });
            }
        }

        // Auto Chat Message if completed
        if (task.status === "Completed" && task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
            const Message = require("../model/Message");
            const completeText = `✅ **Task Completed!**\n\nI have marked the task **"${task.title}"** as completed. Please review it.`;
            
            const newMsg = await Message.create({
                sender: req.user._id,
                receiver: task.createdBy,
                group: "",
                text: completeText
            });

            const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

            if (io) {
                io.to(task.createdBy.toString()).emit("chat_message", populatedMsg);
                io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
            }
        }

        res.json({ message: "Checklist updated", task: updatedTask }); 
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//@desc    Dashboard Data(Admin only )
//@route   GET /api/tasks/dashboard-data
//@access  Private
const getDashboardData = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: "Pending" });
        const completedTasks = await Task.countDocuments({ status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
        });

        // Task Distribution by Status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const statusData = taskDistributionRaw.find(item => item._id === status);
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = statusData ? statusData.count : 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        // Task Distribution by Priority
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            const priorityData = taskPriorityLevelsRaw.find(item => item._id === priority);
            acc[priority] = priorityData ? priorityData.count : 0;
            return acc;
        }, {});

        // Recent Tasks
        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");

        // ✅ Corrected response structure
        res.status(200).json({
            statistics:{
                totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};


//@desc    Dashboard Data(User-specific)
//@route   GET /api/tasks/user-dashboard-data
//@access  Private
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;  
        // Basic Statistics
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
            assignedTo: userId,
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
        });

        // Task Distribution by Status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        // Task Distribution by Priority
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
        }, {});

        // Recent Tasks
        const recentTasks = await Task.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");

        // ✅ Final Response
        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });
    } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
}
};


module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskCheckList,
    getDashboardData,
    getUserDashboardData,
};