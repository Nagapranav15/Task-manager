const Task = require("../model/Task");
const ActivityLog = require("../model/ActivityLog");
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

const encryptTaskIds = (task) => {
    if (!task) return task;
    if (Array.isArray(task)) {
        return task.map(t => encryptTaskIds(t));
    }
    const doc = task._doc || task;
    const taskObj = { ...doc };
    for (const key in task) {
        if (task.hasOwnProperty(key) && key !== '_doc') {
            taskObj[key] = task[key];
        }
    }
    if (taskObj._id) {
        const rawId = taskObj._id.toString();
        if (rawId.includes("-") && rawId.split("-").pop().length <= 6) {
            // Already slugified
        } else {
            taskObj._id = taskObj.slug || (slugify(taskObj.title || "task") + "-" + rawId.substring(18));
        }
    }
    return taskObj;
};

//@desc    Get all tasks(Admin: all, User: Only assigned)
//@route   GET /api/tasks
//@access  Private  
const getTasks = async (req, res) => {
    try {
        const { status, assignedToMe } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        let filter = {};
        if (status) filter.status = status;

        const isUserSpecific = (assignedToMe === "true" || (req.user.role !== "admin" && req.user.role !== "manager"));
        const baseFilter = isUserSpecific 
            ? { ...filter, assignedTo: req.user._id } 
            : filter;

        const [tasksRaw, statusStats, totalFilteredTasks] = await Promise.all([
            Task.find(baseFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("assignedTo", "name email profileImageUrl role")
                .populate("createdBy", "name email profileImageUrl role")
                .lean(),
            Task.aggregate([
                { $match: isUserSpecific ? { assignedTo: req.user._id } : {} },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Task.countDocuments(baseFilter)
        ]);

        const tasks = tasksRaw.map(task => {
            const checklist = Array.isArray(task.todochecklist) ? task.todochecklist : [];
            const completedCount = checklist.filter(item => item && item.completed).length;
            return { ...task, completedTodoCount: completedCount };
        });

        // Compute status summaries from aggregation array
        const getCount = (statusName) => statusStats.find(item => item._id === statusName)?.count || 0;
        const pendingCount = getCount("Pending");
        const inProgressCount = getCount("In Progress");
        const completedCount = getCount("Completed");
        const blockedCount = getCount("Blocked");
        const totalCount = pendingCount + inProgressCount + completedCount + blockedCount;

        const totalPages = Math.ceil(totalFilteredTasks / limit);

        res.status(200).json({
            tasks: encryptTaskIds(tasks),
            currentPage: page,
            totalPages,
            totalTasks: totalFilteredTasks,
            statusSummary: {
                all: totalCount,
                pendingTasks: pendingCount,
                inProgressTasks: inProgressCount,
                completedTasks: completedCount,
                blockedTasks: blockedCount,
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
        const task = await Task.findById(req.params.id)
            .populate("assignedTo", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl role");
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.json(encryptTaskIds(task));
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

            // Sync with Google Calendar
            try {
                const { createCalendarEvent } = require("../utils/googleCalendar");
                const attendeeEmails = populatedTask.assignedTo.map(u => u.email).filter(Boolean);
                const googleEventId = await createCalendarEvent(populatedTask, attendeeEmails);
                if (googleEventId) {
                    task.googleEventId = googleEventId;
                    await task.save();
                }
            } catch (calError) {
                console.error("[Google Calendar] Failed to create event during task creation:", calError.message);
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

        res.status(201).json({ message: "Task created successfully", task: encryptTaskIds(task) });
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
    if (req.user.role === "manager") {
        if (!task.createdBy || task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not able to edit it" });
        }
    } else if (
        req.user.role !== "admin" &&
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
    if (req.body.verificationStatus) {
        task.verificationStatus = req.body.verificationStatus;
    }

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

    // Sync with Google Calendar
    try {
        const populatedUpdatedTask = await Task.findById(updatedTask._id).populate("assignedTo", "name email");
        if (populatedUpdatedTask) {
            const { createCalendarEvent, updateCalendarEvent } = require("../utils/googleCalendar");
            const attendeeEmails = populatedUpdatedTask.assignedTo.map(u => u.email).filter(Boolean);
            
            if (populatedUpdatedTask.googleEventId) {
                await updateCalendarEvent(populatedUpdatedTask.googleEventId, populatedUpdatedTask, attendeeEmails);
            } else {
                const googleEventId = await createCalendarEvent(populatedUpdatedTask, attendeeEmails);
                if (googleEventId) {
                    updatedTask.googleEventId = googleEventId;
                    await updatedTask.save();
                }
            }
        }
    } catch (calError) {
        console.error("[Google Calendar] Failed to sync event during task update:", calError.message);
    }

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

    res.json({ message: "Task updated successfully", task: encryptTaskIds(updatedTask) });

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

        // Manager role check for deletion
        if (req.user.role === "manager") {
            if (!task.createdBy || task.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "You are not able to edit it" });
            }
        } else if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
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

        // Delete from Google Calendar
        if (task.googleEventId) {
            try {
                const { deleteCalendarEvent } = require("../utils/googleCalendar");
                await deleteCalendarEvent(task.googleEventId);
            } catch (calError) {
                console.error("[Google Calendar] Failed to delete event during task deletion:", calError.message);
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
        if (req.body.verificationStatus) {
            let allowed = false;
            if (req.user.role === "admin") {
                allowed = true;
            } else if (req.user.role === "manager") {
                const creator = await User.findById(task.createdBy);
                if (creator && creator.role === "manager") {
                    allowed = true;
                }
            }
            if (!allowed) {
                return res.status(403).json({ message: "Not authorized to update verification status for this task." });
            }
            task.verificationStatus = req.body.verificationStatus;
        }
        
        if (task.status === "Completed") {
            task.todochecklist.forEach((item) => (item.completed = true));
            task.progress = 100;
        }   
        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("createdBy", "name email profileImageUrl role");

        // Sync status update to Google Calendar
        if (populatedTask) {
            try {
                const { createCalendarEvent, updateCalendarEvent } = require("../utils/googleCalendar");
                const attendeeEmails = populatedTask.assignedTo.map(u => u.email).filter(Boolean);
                
                if (populatedTask.googleEventId) {
                    await updateCalendarEvent(populatedTask.googleEventId, populatedTask, attendeeEmails);
                } else {
                    const googleEventId = await createCalendarEvent(populatedTask, attendeeEmails);
                    if (googleEventId) {
                        task.googleEventId = googleEventId;
                        await task.save();
                    }
                }
            } catch (calError) {
                console.error("[Google Calendar] Failed to sync event status change:", calError.message);
            }
        }
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

        res.json({ message: "Task status updated", task: encryptTaskIds(populatedTask) });
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
        const updatedTask = await Task.findById(req.params.id)
            .populate("assignedTo", "name email profileImageUrl")
            .populate("createdBy", "name email profileImageUrl role");

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

        res.json({ message: "Checklist updated", task: encryptTaskIds(updatedTask) }); 
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//@desc    Dashboard Data(Admin only )
//@route   GET /api/tasks/dashboard-data
//@access  Private
const getDashboardData = async (req, res) => {
    try {
        const [recentTasks, statusStats, priorityStats, overdueTasks] = await Promise.all([
            Task.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("assignedTo", "name email profileImageUrl role")
                .populate("createdBy", "name email profileImageUrl role")
                .select("title status priority dueDate createdAt description todochecklist progress assignedTo createdBy")
                .lean(),
            Task.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Task.aggregate([
                { $group: { _id: "$priority", count: { $sum: 1 } } }
            ]),
            Task.countDocuments({
                status: { $ne: "Completed" },
                dueDate: { $lt: new Date() }
            })
        ]);

        // Process status statistics
        const taskStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
        let totalTasks = 0;
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const statusData = statusStats.find(item => item._id === status);
            const count = statusData ? statusData.count : 0;
            totalTasks += count;
            acc[status] = count;
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = count;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        // Process priority statistics
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            const priorityData = priorityStats.find(item => item._id === priority);
            acc[priority] = priorityData ? priorityData.count : 0;
            return acc;
        }, {});

        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks: taskDistribution["Pending"] || 0,
                completedTasks: taskDistribution["Completed"] || 0,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks: encryptTaskIds(recentTasks),
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc    Dashboard Data(User-specific)
//@route   GET /api/tasks/user-dashboard-data
//@access  Private
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        const [recentTasks, statusStats, priorityStats, overdueTasks] = await Promise.all([
            Task.find({ assignedTo: userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("assignedTo", "name email profileImageUrl role")
                .populate("createdBy", "name email profileImageUrl role")
                .select("title status priority dueDate createdAt description todochecklist progress assignedTo createdBy")
                .lean(),
            Task.aggregate([
                { $match: { assignedTo: userId } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Task.aggregate([
                { $match: { assignedTo: userId } },
                { $group: { _id: "$priority", count: { $sum: 1 } } }
            ]),
            Task.countDocuments({
                assignedTo: userId,
                status: { $ne: "Completed" },
                dueDate: { $lt: new Date() }
            })
        ]);

        // Process status statistics
        const taskStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
        let totalTasks = 0;
        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const statusData = statusStats.find(item => item._id === status);
            const count = statusData ? statusData.count : 0;
            totalTasks += count;
            acc[status] = count;
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = count;
            return acc;
        }, {});
        taskDistribution["All"] = totalTasks;

        // Process priority statistics
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            const priorityData = priorityStats.find(item => item._id === priority);
            acc[priority] = priorityData ? priorityData.count : 0;
            return acc;
        }, {});

        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks: taskDistribution["Pending"] || 0,
                completedTasks: taskDistribution["Completed"] || 0,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks: encryptTaskIds(recentTasks),
        });
    } catch (error) {
        console.error("User Dashboard Error:", error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};


const getTasksForVerification = async (req, res) => {
    try {
        let filter = { status: "Completed" };
        if (req.user.role === "manager") {
            filter.createdBy = req.user._id;
        }

        const tasksRaw = await Task.find(filter)
            .sort({ updatedAt: -1 })
            .populate("assignedTo", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl role")
            .lean();

        const tasks = tasksRaw.map(task => {
            const checklist = Array.isArray(task.todochecklist) ? task.todochecklist : [];
            const completedCount = checklist.filter(item => item && item.completed).length;
            return { ...task, completedTodoCount: completedCount };
        });

        res.json({ tasks: encryptTaskIds(tasks) });
    } catch (error) {
        console.error("Get Tasks For Verification Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
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
    getTasksForVerification,
};