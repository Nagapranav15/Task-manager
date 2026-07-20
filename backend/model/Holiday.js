const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dayOfWeek: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Mandatory", "Optional"],
      default: "Mandatory",
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    googleEventId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);
