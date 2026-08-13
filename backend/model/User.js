const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImageUrl: { type: String, default: null },
        role: { type: String, enum: ["admin", "manager", "member"], default: "member" }, // Role based access control
        loginOtp: { type: String, default: null, select: false },
        loginOtpExpiry: { type: Date, default: null, select: false },
        resetOtp: { type: String, default: null, select: false },
        resetOtpExpiry: { type: Date, default: null, select: false },
    },
    { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);