const Group = require("../model/Group");

const registerGroupHandlers = async (io, socket) => {
    const user = socket.data.user;
    if (!user) return;

    const userIdStr = user._id.toString();

    // User automatically joins their individual notifications room
    socket.join(userIdStr);

    // User automatically joins all active group rooms they belong to
    try {
        const userGroups = await Group.find({
            "participants.user": user._id,
            isDeleted: { $ne: true }
        }).select("_id");


        for (const g of userGroups) {
            const roomName = `group:${g._id.toString()}`;
            socket.join(roomName);
        }
    } catch (err) {
        console.error("[Socket Groups Join Error]:", err);
    }

    socket.on("group:join_room", ({ groupId }) => {
        if (groupId) {
            socket.join(`group:${groupId}`);
        }
    });

    socket.on("group:leave_room", ({ groupId }) => {
        if (groupId) {
            socket.leave(`group:${groupId}`);
        }
    });
};

module.exports = { registerGroupHandlers };
