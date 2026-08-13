const onlineUsersMap = new Map(); // socketId -> { userId, status }

const broadcastOnlineUsers = (io) => {
    const activeIds = [];
    const statuses = {};
    for (const [, info] of onlineUsersMap.entries()) {
        if (info && info.userId) {
            activeIds.push(info.userId);
            statuses[info.userId] = info.status || "online";
        }
    }
    io.emit("update_online_users", { activeIds: Array.from(new Set(activeIds)), statuses });
};

const registerPresenceHandlers = (io, socket) => {
    const user = socket.data.user;
    if (!user) return;

    const userIdStr = user._id.toString();
    onlineUsersMap.set(socket.id, { userId: userIdStr, status: "online" });
    broadcastOnlineUsers(io);

    socket.on("presence:update", ({ status }) => {
        if (status) {
            onlineUsersMap.set(socket.id, { userId: userIdStr, status });
            broadcastOnlineUsers(io);
        }
    });

    // Compatibility events
    socket.on("update_my_status", ({ status }) => {
        onlineUsersMap.set(socket.id, { userId: userIdStr, status: status || "online" });
        broadcastOnlineUsers(io);
    });

    socket.on("disconnect", () => {
        onlineUsersMap.delete(socket.id);
        broadcastOnlineUsers(io);
    });
};

module.exports = { registerPresenceHandlers, onlineUsersMap };
