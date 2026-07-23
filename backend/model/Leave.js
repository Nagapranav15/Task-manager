const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["Sick Leave", "Casual Leave", "Paid Leave", "Emergency Leave"],
      default: "Sick Leave",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    leaveDurationType: {
      type: String,
      enum: ["Full Day", "Half Day", "Specific Hours"],
      default: "Full Day",
    },
    halfDayType: {
      type: String,
      enum: ["First Half", "Second Half", null],
      default: null,
    },
    specificStartTime: {
      type: String,
      default: "",
    },
    specificEndTime: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "On Hold"],
      default: "Pending",
    },
    adminComment: {
      type: String,
      default: "",
    },
    proofAttachment: {
      name: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

leaveSchema.index({ applicant: 1, createdAt: -1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Leave", leaveSchema);
