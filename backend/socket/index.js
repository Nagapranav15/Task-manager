const socketAuthMiddleware = require("./auth");
const { registerPresenceHandlers } = require("./presence");
const { registerTypingHandlers } = require("./typing");
const { registerMessageHandlers } = require("./messages");
const { registerGroupHandlers } = require("./groups");

const initSocketIO = (io) => {
    // Authenticate every socket connection via JWT
    io.use(socketAuthMiddleware);

    io.on("connection", async (socket) => {
        const user = socket.data.user;
        console.log(`[Socket] User connected: ${user ? user.name : "Unknown"} (${socket.id})`);

        // Register event handlers
        await registerGroupHandlers(io, socket);
        registerPresenceHandlers(io, socket);
        registerTypingHandlers(io, socket);
        registerMessageHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${user ? user.name : "Unknown"} (${socket.id})`);
        });
    });
};

module.exports = initSocketIO;
