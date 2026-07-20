const Leave = require("../model/Leave");
const User = require("../model/User");
const Message = require("../model/Message");

// @desc    Apply for leave (Members / Managers)
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Administrators do not apply for leave." });
    }

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Start date, end date, and reason are required." });
    }

    const leave = await Leave.create({
      applicant: req.user._id,
      leaveType: leaveType || "Sick Leave",
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    const populatedLeave = await Leave.findById(leave._id).populate("applicant", "name email role profileImageUrl");

    // Emit notification to Admins
    const io = req.app.get("io");
    const admins = await User.find({ role: "admin" }).select("_id");

    const formattedStart = new Date(startDate).toLocaleDateString("en-GB");
    const formattedEnd = new Date(endDate).toLocaleDateString("en-GB");

    for (const admin of admins) {
      // Send chat message to admin
      const chatText = `📋 **New Leave Application Submitted**\n\n**Applicant**: ${req.user.name} (${req.user.role})\n**Type**: ${leaveType || "Sick Leave"}\n**Dates**: ${formattedStart} to ${formattedEnd}\n**Reason**: ${reason}`;
      
      const newMsg = await Message.create({
        sender: req.user._id,
        receiver: admin._id,
        group: "",
        text: chatText,
      });

      const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

      if (io) {
        io.to(admin._id.toString()).emit("chat_message", populatedMsg);
        io.to(admin._id.toString()).emit("notification", {
          type: "leave_requested",
          title: "New Leave Application",
          message: `${req.user.name} applied for ${leaveType || "Sick Leave"} (${formattedStart} - ${formattedEnd}).`,
          leave: populatedLeave,
        });
      }
    }

    res.status(201).json({ message: "Leave application submitted successfully.", leave: populatedLeave });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get leave applications (Members/Managers see own; Admin sees all)
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query.applicant = req.user._id;
    }

    const leaves = await Leave.find(query)
      .populate("applicant", "name email role profileImageUrl")
      .populate("actionBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(leaves);
  } catch (error) {
    console.error("Get Leaves Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update leave status (Admin only: Approve/Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin Only)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    if (!["Approved", "Rejected", "On Hold"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Approved', 'Rejected', or 'On Hold'." });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found." });
    }

    leave.status = status;
    leave.adminComment = adminComment || "";
    leave.actionBy = req.user._id;
    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate("applicant", "name email role profileImageUrl")
      .populate("actionBy", "name email");

    // Notify Applicant via Socket & Chat Message
    const io = req.app.get("io");
    const formattedStart = new Date(leave.startDate).toLocaleDateString("en-GB");
    const statusEmoji = status === "Approved" ? "✅" : status === "Rejected" ? "❌" : "⏸️";
    const chatText = `${statusEmoji} **Leave Application ${status}**\n\n**Type**: ${leave.leaveType}\n**Dates**: ${formattedStart}\n${adminComment ? `**Comment**: ${adminComment}` : ""}\n\n*Processed by ${req.user.name}*`;

    const newMsg = await Message.create({
      sender: req.user._id,
      receiver: leave.applicant._id,
      group: "",
      text: chatText,
    });

    const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

    if (io) {
      io.to(leave.applicant._id.toString()).emit("chat_message", populatedMsg);
      io.to(leave.applicant._id.toString()).emit("notification", {
        type: "leave_status_updated",
        title: `Leave Application ${status}`,
        message: `Your ${leave.leaveType} application has been ${status.toLowerCase()} by ${req.user.name}.`,
        leave: updatedLeave,
      });
    }

    res.status(200).json({ message: `Leave application ${status.toLowerCase()} successfully.`, leave: updatedLeave });
  } catch (error) {
    console.error("Update Leave Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
};
