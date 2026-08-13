const mongoose = require("mongoose");

const googleIntegrationSchema = new mongoose.Schema(
    {
        refreshToken: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GoogleIntegration", googleIntegrationSchema);
