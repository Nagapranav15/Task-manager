const mongoose = require("mongoose");
const Group = require("../model/Group");

const getGroupId = (req) => {
    return req.params.id || req.params.groupId || req.query.group || req.body.groupId;
};

const requireGroupMember = async (req, res, next) => {
    try {
        const groupId = getGroupId(req);
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "Invalid or missing group ID" });
        }

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const userIdStr = req.user._id.toString();
        const participant = group.participants.find(p => p.user && p.user.toString() === userIdStr);

        if (!participant) {
            return res.status(403).json({ message: "Access denied: You are not a member of this group" });
        }

        req.group = group;
        req.userRole = participant.role;
        next();
    } catch (error) {
        console.error("requireGroupMember Error:", error);
        res.status(500).json({ message: "Server error checking group membership", error: error.message });
    }
};

const requireGroupAdmin = async (req, res, next) => {
    try {
        const groupId = getGroupId(req);
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "Invalid or missing group ID" });
        }

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const userIdStr = req.user._id.toString();
        const participant = group.participants.find(p => p.user && p.user.toString() === userIdStr);

        if (!participant || (participant.role !== "admin" && participant.role !== "owner")) {
            return res.status(403).json({ message: "Access denied: Admin privileges required" });
        }

        req.group = group;
        req.userRole = participant.role;
        next();
    } catch (error) {
        console.error("requireGroupAdmin Error:", error);
        res.status(500).json({ message: "Server error checking admin privileges", error: error.message });
    }
};

const requireGroupOwner = async (req, res, next) => {
    try {
        const groupId = getGroupId(req);
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "Invalid or missing group ID" });
        }

        const group = await Group.findOne({ _id: groupId, isDeleted: false });
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const userIdStr = req.user._id.toString();
        const participant = group.participants.find(p => p.user && p.user.toString() === userIdStr);

        if (!participant || participant.role !== "owner") {
            return res.status(403).json({ message: "Access denied: Group owner privileges required" });
        }

        req.group = group;
        req.userRole = participant.role;
        next();
    } catch (error) {
        console.error("requireGroupOwner Error:", error);
        res.status(500).json({ message: "Server error checking owner privileges", error: error.message });
    }
};

module.exports = {
    requireGroupMember,
    requireGroupAdmin,
    requireGroupOwner
};
