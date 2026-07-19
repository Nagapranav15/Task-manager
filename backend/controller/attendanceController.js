const Attendance = require("../model/Attendance");
const ActivityLog = require("../model/ActivityLog");

// @desc    Clock In
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;

        if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
            return res.status(400).json({ message: "Location coordinates (latitude and longitude) are required." });
        }

        // Check if there is an active checked-in session
        const activeSession = await Attendance.findOne({
            user: req.user._id,
            status: "Checked-In"
        });

        if (activeSession) {
            return res.status(400).json({ message: "You are already clocked in." });
        }

        const log = new Attendance({
            user: req.user._id,
            clockInTime: new Date(),
            clockInLocation: { latitude, longitude, address },
            status: "Checked-In"
        });

        await log.save();

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Clock In",
            details: `Clocked in at ${address || "Unknown Location"}`
        });

        // Socket clock-in notification for Admins/Managers
        const io = req.app.get("io");
        if (io) {
            try {
                const User = require("../model/User");
                if (req.user.role === "member") {
                    const receivers = await User.find({ role: { $in: ["admin", "manager"] } });
                    receivers.forEach(r => {
                        io.to(r._id.toString()).emit("notification", {
                            type: "clock_in",
                            title: "User Clocked In",
                            message: `${req.user.name} clocked in at ${address || "Unknown Location"}`,
                            userId: req.user._id
                        });
                    });
                } else if (req.user.role === "manager") {
                    const admins = await User.find({ role: "admin" });
                    admins.forEach(a => {
                        io.to(a._id.toString()).emit("notification", {
                            type: "clock_in",
                            title: "Manager Clocked In",
                            message: `Manager ${req.user.name} clocked in at ${address || "Unknown Location"}`,
                            userId: req.user._id
                        });
                    });
                }
            } catch (err) {
                console.error("Socket clock in notification failed:", err);
            }
        }

        res.status(201).json({ message: "Clock-in successful.", log });
    } catch (error) {
        console.error("Clock In Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Clock Out
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;

        if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
            return res.status(400).json({ message: "Location coordinates (latitude and longitude) are required." });
        }

        // Find the active checked-in session
        const activeSession = await Attendance.findOne({
            user: req.user._id,
            status: "Checked-In"
        });

        if (!activeSession) {
            return res.status(400).json({ message: "No active check-in session found." });
        }

        activeSession.clockOutTime = new Date();
        activeSession.clockOutLocation = { latitude, longitude, address };
        activeSession.status = "Checked-Out";

        await activeSession.save();

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Clock Out",
            details: `Clocked out at ${address || "Unknown Location"}`
        });

        // Socket clock-out notification for Admins/Managers
        const io = req.app.get("io");
        if (io) {
            try {
                const User = require("../model/User");
                if (req.user.role === "member") {
                    const receivers = await User.find({ role: { $in: ["admin", "manager"] } });
                    receivers.forEach(r => {
                        io.to(r._id.toString()).emit("notification", {
                            type: "clock_out",
                            title: "User Clocked Out",
                            message: `${req.user.name} clocked out at ${address || "Unknown Location"}`,
                            userId: req.user._id
                        });
                    });
                } else if (req.user.role === "manager") {
                    const admins = await User.find({ role: "admin" });
                    admins.forEach(a => {
                        io.to(a._id.toString()).emit("notification", {
                            type: "clock_out",
                            title: "Manager Clocked Out",
                            message: `Manager ${req.user.name} clocked out at ${address || "Unknown Location"}`,
                            userId: req.user._id
                        });
                    });
                }
            } catch (err) {
                console.error("Socket clock out notification failed:", err);
            }
        }

        res.status(200).json({ message: "Clock-out successful.", log: activeSession });
    } catch (error) {
        console.error("Clock Out Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get user's attendance logs
// @route   GET /api/attendance/my-logs
// @access  Private
const getMyLogs = async (req, res) => {
    try {
        const logs = await Attendance.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json(logs);
    } catch (error) {
        console.error("Get My Logs Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get all attendance logs (Admin only)
// @route   GET /api/attendance/admin/all-logs
// @access  Private/Admin
const adminGetAllLogs = async (req, res) => {
    try {
        const logs = await Attendance.find()
            .populate("user", "name email profileImageUrl")
            .sort({ createdAt: -1 });
        res.status(200).json(logs);
    } catch (error) {
        console.error("Admin Get All Logs Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update attendance log (Admin only)
// @route   PUT /api/attendance/admin/log/:id
// @access  Private/Admin
const adminUpdateLog = async (req, res) => {
    try {
        const { clockInTime, clockOutTime, clockInAddress, clockOutAddress } = req.body;

        const log = await Attendance.findById(req.params.id).populate("user", "name");
        if (!log) {
            return res.status(404).json({ message: "Log record not found." });
        }

        if (clockInTime) log.clockInTime = new Date(clockInTime);
        if (clockOutTime) log.clockOutTime = new Date(clockOutTime);
        if (clockInAddress) log.clockInLocation = { ...log.clockInLocation, address: clockInAddress };
        if (clockOutAddress) log.clockOutLocation = { ...log.clockOutLocation, address: clockOutAddress };

        // If clockOutTime is provided, ensure status is Checked-Out
        if (log.clockOutTime) {
            log.status = "Checked-Out";
        }

        await log.save();

        await ActivityLog.create({
            user: req.user._id,
            action: "Attendance Updated",
            details: `Updated attendance record for "${log.user?.name || "Unknown User"}"`
        });

        res.status(200).json({ message: "Attendance record updated successfully.", log });
    } catch (error) {
        console.error("Admin Update Log Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const excelJS = require("exceljs");

const adminExportLogs = async (req, res) => {
    try {
        const logs = await Attendance.find().populate("user", "name email").sort({ createdAt: -1 });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Attendance Logs");

        worksheet.columns = [
            { header: "User Name", key: "userName", width: 25 },
            { header: "User Email", key: "userEmail", width: 30 },
            { header: "Clock In Time", key: "clockInTime", width: 25 },
            { header: "Clock In Location", key: "clockInLocation", width: 40 },
            { header: "Clock Out Time", key: "clockOutTime", width: 25 },
            { header: "Clock Out Location", key: "clockOutLocation", width: 40 },
            { header: "Status", key: "status", width: 15 }
        ];

        logs.forEach((log) => {
            worksheet.addRow({
                userName: log.user?.name || "Unknown User",
                userEmail: log.user?.email || "N/A",
                clockInTime: log.clockInTime ? new Date(log.clockInTime).toLocaleString() : "N/A",
                clockInLocation: log.clockInLocation?.address || "N/A",
                clockOutTime: log.clockOutTime ? new Date(log.clockOutTime).toLocaleString() : "N/A",
                clockOutLocation: log.clockOutLocation?.address || "N/A",
                status: log.status
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "attendance_logs.xlsx"
        );

        return workbook.xlsx.write(res).then(() => {
            res.end();
        });
    } catch (error) {
        console.error("Export Attendance Logs Error:", error);
        res.status(500).json({ message: "Error exporting attendance logs", error: error.message });
    }
};

const adminDeleteOldLogs = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30); // 1 month/30 days ago

        const result = await Attendance.deleteMany({
            createdAt: { $lt: oneMonthAgo }
        });

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Attendance Logs Deleted",
            details: `Admin deleted all attendance logs older than 1 month (${result.deletedCount} logs)`
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} logs older than 1 month.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Delete Old Attendance Logs Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getMyLogs,
    adminGetAllLogs,
    adminUpdateLog,
    adminExportLogs,
    adminDeleteOldLogs
};
