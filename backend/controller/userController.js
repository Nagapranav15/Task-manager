const Task = require("../model/Task");
const User = require("../model/User");

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private (Admin)
const getUsers = async (req, res) => {
    try {
        // Single parallel roundtrip to retrieve users and task counts grouped by assignedTo and status
        const [users, counts] = await Promise.all([
            User.find().select("-password").lean(),
            Task.aggregate([
                { $unwind: "$assignedTo" },
                { 
                    $group: { 
                        _id: { userId: "$assignedTo", status: "$status" }, 
                        count: { $sum: 1 } 
                    } 
                }
            ])
        ]);

        const countMap = {};
        counts.forEach(item => {
            if (item._id && item._id.userId) {
                const userId = item._id.userId.toString();
                const status = item._id.status;
                if (!countMap[userId]) {
                    countMap[userId] = { Pending: 0, "In Progress": 0, Completed: 0 };
                }
                countMap[userId][status] = item.count;
            }
        });

        const userWithTaskCounts = users.map(user => {
            const userIdStr = user._id.toString();
            const userCounts = countMap[userIdStr] || { Pending: 0, "In Progress": 0, Completed: 0 };
            return {
                ...(user._doc || user),
                pendingTasks: userCounts["Pending"] || 0,
                inProgressTasks: userCounts["In Progress"] || 0,
                completedTasks: userCounts["Completed"] || 0
            };
        });

        res.json(userWithTaskCounts);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }       
};

// @desc Get user by ID 
// @route GET /api/users/:id
// @access Private       
const getUserById = async (req, res) => {   
    try {       
        const user = await User.findById(req.params.id).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Delete user by ID (Admin only)
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const ActivityLog = require("../model/ActivityLog");
        await ActivityLog.create({
            user: req.user._id,
            action: "User Deleted",
            details: `Deleted user account for "${user.name}"`
        });
        await user.deleteOne();
        return res.json({ message: "User deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc Update user role (Admin only)
// @route PUT /api/users/:id/role
// @access Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["admin", "manager", "member"].includes(role)) {
            return res.status(400).json({ message: "Invalid role value" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.role = role;
        await user.save();

        const ActivityLog = require("../model/ActivityLog");
        await ActivityLog.create({
            user: req.user._id,
            action: "Role Updated",
            details: `Updated role of "${user.name}" to ${role}`
        });

        return res.json({ message: `Successfully updated user role to ${role}`, user });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    deleteUser,
    updateUserRole,
};