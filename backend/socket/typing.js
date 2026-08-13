const registerTypingHandlers = (io, socket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.on("typing:start", ({ conversationId, conversationType }) => {
        if (!conversationId) return;

        const payload = {
            conversationId,
            conversationType,
            userId: user._id.toString(),
            userName: user.name
        };

        if (conversationType === "group") {
            socket.to(`group:${conversationId}`).emit("typing:update", { ...payload, isTyping: true });
        } else {
            socket.to(conversationId).emit("typing:update", { ...payload, isTyping: true });
        }
    });

    socket.on("typing:stop", ({ conversationId, conversationType }) => {
        if (!conversationId) return;

        const payload = {
            conversationId,
            conversationType,
            userId: user._id.toString(),
            userName: user.name
        };

        if (conversationType === "group") {
            socket.to(`group:${conversationId}`).emit("typing:update", { ...payload, isTyping: false });
        } else {
            socket.to(conversationId).emit("typing:update", { ...payload, isTyping: false });
        }
    });
};

module.exports = { registerTypingHandlers };
