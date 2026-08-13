const mongoose = require("mongoose");
const crypto = require("crypto");
const Group = require("../model/Group");
const Message = require("../model/Message");
const User = require("../model/User");

// Helper function to emit system event message
const createSystemMessage = async (req, groupId, kind, targets = [], value = "") => {
    try {
        const io = req.app.get("io");
        const sysMsg = await Message.create({
            conversation: {
                type: "group",
                group: groupId,
                peer: null
            },
            sender: req.user._id,
            type: "system",
            text: "",
            systemEvent: {
                kind,
                actor: req.user._id,
                targets: targets.map(t => new mongoose.Types.ObjectId(t)),
                value
            }
        });

        const populated = await Message.findById(sysMsg._id)
            .populate("sender", "name email profileImageUrl role")
            .populate("systemEvent.actor", "name email")
            .populate("systemEvent.targets", "name email");

        if (io) {
            io.to(`group:${groupId.toString()}`).emit("message:new", populated);
        }
        return populated;
    } catch (e) {
        console.error("createSystemMessage error:", e);
    }
};

// @desc Create a new group
// @route POST /api/chat/groups
// @access Private
const createGroup = async (req, res) => {
    try {
        const { name, description, avatarUrl, participants: rawParticipants } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const creatorId = req.user._id;
        const participantIds = new Set([creatorId.toString()]);

        if (Array.isArray(rawParticipants)) {
            rawParticipants.forEach(id => {
                if (id && mongoose.Types.ObjectId.isValid(id)) {
                    participantIds.add(id.toString());
                }
            });
        }

        const participants = Array.from(participantIds).map(idStr => ({
            user: new mongoose.Types.ObjectId(idStr),
            role: idStr === creatorId.toString() ? "owner" : "member",
            joinedAt: new Date(),
            addedBy: creatorId
        }));

        const group = await Group.create({
            name: name.trim(),
            description: (description || "").substring(0, 512),
            avatarUrl: avatarUrl || "",
            createdBy: creatorId,
            participants,
            settings: {
                whoCanSendMessages: "all",
                whoCanEditInfo: "all",
                whoCanAddParticipants: "all",
                disappearingMessagesSeconds: null
            }
        });

        const populatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        // Notify socket clients to join the new room
        const io = req.app.get("io");
        if (io) {
            for (const p of participants) {
                io.to(p.user.toString()).emit("group:created", populatedGroup);
            }
        }

        // Write system message
        const addedTargets = participants.filter(p => p.user.toString() !== creatorId.toString()).map(p => p.user);
        if (addedTargets.length > 0) {
            await createSystemMessage(req, group._id, "member_added", addedTargets);
        }

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Create Group Error:", error);
        res.status(500).json({ message: "Failed to create group", error: error.message });
    }
};

// @desc Get all groups for logged-in user
// @route GET /api/chat/groups
// @access Private
const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({
            "participants.user": userId,
            isDeleted: false
        })
        .populate("participants.user", "name email profileImageUrl role")
        .populate("createdBy", "name email profileImageUrl")
        .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Get Groups Error:", error);
        res.status(500).json({ message: "Failed to fetch groups", error: error.message });
    }
};

// @desc Get group info by ID
// @route GET /api/chat/groups/:id
// @access Private (requireGroupMember)
const getGroupById = async (req, res) => {
    try {
        const group = await Group.findOne({ _id: req.params.id, isDeleted: false })
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        res.status(200).json(group);
    } catch (error) {
        console.error("Get Group By Id Error:", error);
        res.status(500).json({ message: "Failed to fetch group info", error: error.message });
    }
};

// @desc Update group name, description, avatar
// @route PATCH /api/chat/groups/:id
// @access Private (requireGroupMember)
const updateGroup = async (req, res) => {
    try {
        const group = req.group;
        const { name, description, avatarUrl } = req.body;

        if (group.settings?.whoCanEditInfo === "admins" && req.userRole !== "admin" && req.userRole !== "owner") {
            return res.status(403).json({ message: "Only admins can edit group info" });
        }

        let nameChanged = false;
        let descChanged = false;
        let avatarChanged = false;

        if (name !== undefined && name.trim() && name.trim() !== group.name) {
            group.name = name.trim();
            nameChanged = true;
        }
        if (description !== undefined && description !== group.description) {
            group.description = description.substring(0, 512);
            descChanged = true;
        }
        if (avatarUrl !== undefined && avatarUrl !== group.avatarUrl) {
            group.avatarUrl = avatarUrl;
            avatarChanged = true;
        }

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        if (nameChanged) await createSystemMessage(req, group._id, "group_name_changed", [], group.name);
        if (descChanged) await createSystemMessage(req, group._id, "group_description_changed", [], group.description);
        if (avatarChanged) await createSystemMessage(req, group._id, "group_avatar_changed", [], group.avatarUrl);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Update Group Error:", error);
        res.status(500).json({ message: "Failed to update group", error: error.message });
    }
};

// @desc Add participants to group
// @route POST /api/chat/groups/:id/participants
// @access Private (requireGroupMember)
const addParticipants = async (req, res) => {
    try {
        const group = req.group;
        const { participants: userIds } = req.body;

        if (group.settings?.whoCanAddParticipants === "admins" && req.userRole !== "admin" && req.userRole !== "owner") {
            return res.status(403).json({ message: "Only admins can add participants" });
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "No participants specified" });
        }

        const existingMap = new Set(group.participants.map(p => p.user.toString()));
        const newlyAdded = [];

        for (const uId of userIds) {
            if (uId && mongoose.Types.ObjectId.isValid(uId) && !existingMap.has(uId.toString())) {
                existingMap.add(uId.toString());
                group.participants.push({
                    user: new mongoose.Types.ObjectId(uId),
                    role: "member",
                    joinedAt: new Date(),
                    addedBy: req.user._id
                });
                newlyAdded.push(uId.toString());
            }
        }

        if (newlyAdded.length === 0) {
            return res.status(400).json({ message: "All specified users are already in the group" });
        }

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            for (const addedId of newlyAdded) {
                io.to(addedId).emit("group:created", updatedGroup);
            }
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        await createSystemMessage(req, group._id, "member_added", newlyAdded);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Add Participants Error:", error);
        res.status(500).json({ message: "Failed to add participants", error: error.message });
    }
};

// @desc Remove participant from group
// @route DELETE /api/chat/groups/:id/participants/:userId
// @access Private (requireGroupMember)
const removeParticipant = async (req, res) => {
    try {
        const group = req.group;
        const targetUserId = req.params.userId;

        const isSelf = targetUserId === req.user._id.toString();
        if (!isSelf && req.userRole !== "admin" && req.userRole !== "owner") {
            return res.status(403).json({ message: "Only admins can remove participants" });
        }

        const targetIndex = group.participants.findIndex(p => p.user.toString() === targetUserId);
        if (targetIndex === -1) {
            return res.status(404).json({ message: "User is not a member of this group" });
        }

        const targetRole = group.participants[targetIndex].role;
        if (targetRole === "owner" && !isSelf) {
            return res.status(403).json({ message: "Cannot remove group owner" });
        }

        group.participants.splice(targetIndex, 1);
        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(targetUserId).emit("group:removed", { groupId: group._id.toString() });
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        await createSystemMessage(req, group._id, isSelf ? "member_left" : "member_removed", [targetUserId]);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Remove Participant Error:", error);
        res.status(500).json({ message: "Failed to remove participant", error: error.message });
    }
};

// @desc Promote participant to admin
// @route POST /api/chat/groups/:id/participants/:userId/promote
// @access Private (requireGroupAdmin)
const promoteParticipant = async (req, res) => {
    try {
        const group = req.group;
        const targetUserId = req.params.userId;

        const participant = group.participants.find(p => p.user.toString() === targetUserId);
        if (!participant) {
            return res.status(404).json({ message: "User not found in group" });
        }

        if (participant.role === "admin" || participant.role === "owner") {
            return res.status(400).json({ message: "User is already an admin or owner" });
        }

        participant.role = "admin";
        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        await createSystemMessage(req, group._id, "member_promoted", [targetUserId]);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Promote Participant Error:", error);
        res.status(500).json({ message: "Failed to promote participant", error: error.message });
    }
};

// @desc Demote admin to member
// @route POST /api/chat/groups/:id/participants/:userId/demote
// @access Private (requireGroupAdmin)
const demoteParticipant = async (req, res) => {
    try {
        const group = req.group;
        const targetUserId = req.params.userId;

        const participant = group.participants.find(p => p.user.toString() === targetUserId);
        if (!participant) {
            return res.status(404).json({ message: "User not found in group" });
        }

        if (participant.role === "owner") {
            return res.status(403).json({ message: "Cannot demote the group owner" });
        }

        participant.role = "member";
        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        await createSystemMessage(req, group._id, "member_demoted", [targetUserId]);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Demote Participant Error:", error);
        res.status(500).json({ message: "Failed to demote participant", error: error.message });
    }
};

// @desc Leave group with ownership transfer
// @route POST /api/chat/groups/:id/leave
// @access Private (requireGroupMember)
const leaveGroup = async (req, res) => {
    try {
        const group = req.group;
        const userIdStr = req.user._id.toString();

        const index = group.participants.findIndex(p => p.user.toString() === userIdStr);
        if (index === -1) {
            return res.status(400).json({ message: "You are not a participant in this group" });
        }

        const leavingRole = group.participants[index].role;
        group.participants.splice(index, 1);

        // If owner left, transfer ownership to longest-tenured admin, else longest-tenured member, else soft delete
        if (leavingRole === "owner") {
            if (group.participants.length === 0) {
                group.isDeleted = true;
                group.deletedAt = new Date();
            } else {
                const admins = group.participants
                    .filter(p => p.role === "admin")
                    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

                if (admins.length > 0) {
                    admins[0].role = "owner";
                } else {
                    const members = group.participants
                        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
                    members[0].role = "owner";
                }
            }
        }

        await group.save();

        const io = req.app.get("io");
        if (io) {
            io.to(userIdStr).emit("group:removed", { groupId: group._id.toString() });
        }

        if (!group.isDeleted) {
            const updatedGroup = await Group.findById(group._id)
                .populate("participants.user", "name email profileImageUrl role")
                .populate("createdBy", "name email profileImageUrl");

            if (io) {
                io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
            }
            await createSystemMessage(req, group._id, "member_left", [userIdStr]);
        }

        res.status(200).json({ message: "Successfully left the group", groupId: group._id });
    } catch (error) {
        console.error("Leave Group Error:", error);
        res.status(500).json({ message: "Failed to leave group", error: error.message });
    }
};

// @desc Update group settings
// @route PATCH /api/chat/groups/:id/settings
// @access Private (requireGroupAdmin)
const updateSettings = async (req, res) => {
    try {
        const group = req.group;
        const { whoCanSendMessages, whoCanEditInfo, whoCanAddParticipants, disappearingMessagesSeconds } = req.body;

        if (whoCanSendMessages) group.settings.whoCanSendMessages = whoCanSendMessages;
        if (whoCanEditInfo) group.settings.whoCanEditInfo = whoCanEditInfo;
        if (whoCanAddParticipants) group.settings.whoCanAddParticipants = whoCanAddParticipants;
        if (disappearingMessagesSeconds !== undefined) {
            group.settings.disappearingMessagesSeconds = disappearingMessagesSeconds;
        }

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        if (disappearingMessagesSeconds !== undefined) {
            await createSystemMessage(req, group._id, "disappearing_messages_changed", [], disappearingMessagesSeconds ? `${disappearingMessagesSeconds}s` : "off");
        } else {
            await createSystemMessage(req, group._id, "settings_changed", [], JSON.stringify(group.settings));
        }

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Update Settings Error:", error);
        res.status(500).json({ message: "Failed to update settings", error: error.message });
    }
};

// @desc Create or rotate invite code
// @route POST /api/chat/groups/:id/invite
// @access Private (requireGroupAdmin)
const createInviteCode = async (req, res) => {
    try {
        const group = req.group;
        const code = crypto.randomBytes(8).toString("hex");
        group.inviteCode = code;
        group.inviteCodeCreatedAt = new Date();
        await group.save();

        res.status(200).json({ inviteCode: group.inviteCode, inviteCodeCreatedAt: group.inviteCodeCreatedAt });
    } catch (error) {
        console.error("Create Invite Code Error:", error);
        res.status(500).json({ message: "Failed to create invite code", error: error.message });
    }
};

// @desc Revoke invite code
// @route DELETE /api/chat/groups/:id/invite
// @access Private (requireGroupAdmin)
const revokeInviteCode = async (req, res) => {
    try {
        const group = req.group;
        group.inviteCode = undefined;
        group.inviteCodeCreatedAt = undefined;
        await group.save();

        res.status(200).json({ message: "Invite code revoked" });
    } catch (error) {
        console.error("Revoke Invite Code Error:", error);
        res.status(500).json({ message: "Failed to revoke invite code", error: error.message });
    }
};

// @desc Join group by invite code
// @route POST /api/chat/groups/join/:inviteCode
// @access Private
const joinByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const group = await Group.findOne({ inviteCode, isDeleted: false });

        if (!group) {
            return res.status(404).json({ message: "Invalid or expired invite link" });
        }

        const userIdStr = req.user._id.toString();
        const existing = group.participants.find(p => p.user.toString() === userIdStr);

        if (existing) {
            return res.status(400).json({ message: "You are already a member of this group", groupId: group._id });
        }

        group.participants.push({
            user: req.user._id,
            role: "member",
            joinedAt: new Date()
        });

        await group.save();

        const updatedGroup = await Group.findById(group._id)
            .populate("participants.user", "name email profileImageUrl role")
            .populate("createdBy", "name email profileImageUrl");

        const io = req.app.get("io");
        if (io) {
            io.to(userIdStr).emit("group:created", updatedGroup);
            io.to(`group:${group._id.toString()}`).emit("group:updated", updatedGroup);
        }

        await createSystemMessage(req, group._id, "member_added", [userIdStr]);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error("Join By Invite Code Error:", error);
        res.status(500).json({ message: "Failed to join group", error: error.message });
    }
};

// @desc Soft-delete group
// @route DELETE /api/chat/groups/:id
// @access Private (requireGroupOwner)
const deleteGroup = async (req, res) => {
    try {
        const group = req.group;
        group.isDeleted = true;
        group.deletedAt = new Date();
        await group.save();

        const io = req.app.get("io");
        if (io) {
            io.to(`group:${group._id.toString()}`).emit("group:deleted", { groupId: group._id.toString() });
        }

        res.status(200).json({ message: "Group deleted successfully", groupId: group._id });
    } catch (error) {
        console.error("Delete Group Error:", error);
        res.status(500).json({ message: "Failed to delete group", error: error.message });
    }
};

module.exports = {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    addParticipants,
    removeParticipant,
    promoteParticipant,
    demoteParticipant,
    leaveGroup,
    updateSettings,
    createInviteCode,
    revokeInviteCode,
    joinByInviteCode,
    deleteGroup
};
