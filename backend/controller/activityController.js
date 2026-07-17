const ActivityLog = require("../model/ActivityLog");

// @desc    Get activity logs
// @route   GET /api/activity
// @access  Private
const getActivities = async (req, res) => {
    try {
        console.log(`[Activities] Fetch logs request from: ${req.user.name} (${req.user.email}) - Role: ${req.user.role}`);
        let logs;
        if (req.user.role === "admin" || req.user.role === "manager") {
            logs = await ActivityLog.find()
                .populate("user", "name email profileImageUrl")
                .sort({ createdAt: -1 })
                .limit(100);
        } else {
            logs = await ActivityLog.find({ user: req.user._id })
                .populate("user", "name email profileImageUrl")
                .sort({ createdAt: -1 })
                .limit(50);
        }
        console.log(`[Activities] Successfully returned ${logs.length} activity logs.`);
        res.status(200).json(logs);
    } catch (error) {
        console.error("Get Activities Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { getActivities };
