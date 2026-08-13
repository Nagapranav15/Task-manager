const mongoose = require("mongoose");
const Message = require("../model/Message");
const Group = require("../model/Group");
const ChatState = require("../model/ChatState");

const registerMessageHandlers = (io, socket) => {
    const user = socket.data.user;
    if (!user) return;

    const senderId = user._id;

    // Send a message
    socket.on("message:send", async (data, callback) => {
        try {
            const { conversationId, conversationType, type, text, attachments, replyTo, mentions, clientId } = data;

            if (!conversationId || !conversationType) {
                if (callback) callback({ error: "Missing conversationId or conversationType" });
                return;
            }

            let groupDoc = null;
            let expiresAt = null;

            if (conversationType === "group") {
                groupDoc = await Group.findOne({ _id: conversationId, isDeleted: false });
                if (!groupDoc) {
                    if (callback) callback({ error: "Group not found or deleted" });
                    return;
                }

                const participant = groupDoc.participants.find(p => p.user.toString() === senderId.toString());
                if (!participant) {
                    if (callback) callback({ error: "You are not a member of this group" });
                    return;
                }

                if (groupDoc.settings?.whoCanSendMessages === "admins" && participant.role !== "admin" && participant.role !== "owner") {
                    if (callback) callback({ error: "Only admins can send messages in this group" });
                    return;
                }

                if (groupDoc.settings?.disappearingMessagesSeconds) {
                    expiresAt = new Date(Date.now() + groupDoc.settings.disappearingMessagesSeconds * 1000);
                }
            }

            const conversationObj = {
                type: conversationType,
                group: conversationType === "group" ? new mongoose.Types.ObjectId(conversationId) : null,
                peer: conversationType === "dm" ? new mongoose.Types.ObjectId(conversationId) : null
            };

            const validMentions = Array.isArray(mentions)
                ? mentions.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
                : [];

            const mentionsEveryone = text ? text.includes("@everyone") : false;

            const newMsg = await Message.create({
                conversation: conversationObj,
                sender: senderId,
                type: type || "text",
                text: text || "",
                attachments: attachments || [],
                replyTo: replyTo && mongoose.Types.ObjectId.isValid(replyTo) ? new mongoose.Types.ObjectId(replyTo) : null,
                mentions: validMentions,
                mentionsEveryone,
                expiresAt,
                deliveries: [{ user: senderId, deliveredAt: new Date(), readAt: new Date() }]
            });

            const populatedMsg = await Message.findById(newMsg._id)
                .populate("sender", "name email profileImageUrl role")
                .populate("replyTo")
                .populate("mentions", "name email");

            const msgObj = populatedMsg.toObject();
            msgObj.clientId = clientId;

            if (conversationType === "group") {
                const roomName = `group:${conversationId}`;
                io.to(roomName).emit("message:new", msgObj);
            } else {
                const peerRoom = conversationId.toString();
                const senderRoom = senderId.toString();
                io.to(peerRoom).emit("message:new", msgObj);
                if (peerRoom !== senderRoom) {
                    io.to(senderRoom).emit("message:new", msgObj);
                }
            }

            if (callback) callback({ status: "ok", message: msgObj });
        } catch (error) {
            console.error("message:send Error:", error);
            if (callback) callback({ error: error.message });
        }
    });

    // Mark message as delivered
    socket.on("message:delivered", async ({ messageId }) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
            const msg = await Message.findById(messageId);
            if (!msg) return;

            const existing = msg.deliveries.find(d => d.user.toString() === senderId.toString());
            if (!existing) {
                msg.deliveries.push({ user: senderId, deliveredAt: new Date() });
                await msg.save();
            }

            const roomName = msg.conversation.type === "group" 
                ? `group:${msg.conversation.group.toString()}` 
                : msg.sender.toString();

            io.to(roomName).emit("message:delivered", { messageId, userId: senderId.toString(), deliveredAt: new Date() });
        } catch (error) {
            console.error("message:delivered Error:", error);
        }
    });

    // Mark conversation read up to a message
    socket.on("message:read", async ({ conversationId, conversationType, upToMessageId }) => {
        try {
            if (!conversationId) return;

            let query = {};
            if (conversationType === "group") {
                query = { "conversation.group": conversationId };
            } else {
                query = {
                    $or: [
                        { "conversation.peer": conversationId, sender: senderId },
                        { "conversation.peer": senderId, sender: conversationId }
                    ]
                };
            }

            if (upToMessageId && mongoose.Types.ObjectId.isValid(upToMessageId)) {
                query._id = { $lte: upToMessageId };
            }

            const unreadMsgs = await Message.find(query);
            const now = new Date();

            for (const msg of unreadMsgs) {
                let d = msg.deliveries.find(d => d.user.toString() === senderId.toString());
                if (!d) {
                    msg.deliveries.push({ user: senderId, deliveredAt: now, readAt: now });
                    await msg.save();
                } else if (!d.readAt) {
                    d.readAt = now;
                    await msg.save();
                }
            }

            // Update ChatState
            await ChatState.findOneAndUpdate(
                { user: senderId, conversationType, conversationId },
                { lastReadMessageId: upToMessageId },
                { upsert: true }
            );

            const targetRoom = conversationType === "group" ? `group:${conversationId}` : conversationId.toString();
            io.to(targetRoom).emit("message:read", {
                conversationId,
                conversationType,
                userId: senderId.toString(),
                readAt: now,
                upToMessageId
            });
        } catch (error) {
            console.error("message:read Error:", error);
        }
    });

    // Add or remove reaction
    socket.on("message:react", async ({ messageId, emoji }, callback) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
            const msg = await Message.findById(messageId);
            if (!msg) return;

            const existingIndex = msg.reactions.findIndex(r => r.user.toString() === senderId.toString());
            if (existingIndex !== -1) {
                msg.reactions.splice(existingIndex, 1);
            }

            if (emoji) {
                msg.reactions.push({ user: senderId, emoji, at: new Date() });
            }

            await msg.save();

            const targetRoom = msg.conversation.type === "group"
                ? `group:${msg.conversation.group.toString()}`
                : msg.conversation.peer
                    ? msg.conversation.peer.toString()
                    : msg.sender.toString();

            io.to(targetRoom).emit("message:react", { messageId, reactions: msg.reactions });
            if (msg.conversation.type === "dm") {
                io.to(msg.sender.toString()).emit("message:react", { messageId, reactions: msg.reactions });
            }

            if (callback) callback({ status: "ok", reactions: msg.reactions });
        } catch (error) {
            console.error("message:react Error:", error);
            if (callback) callback({ error: error.message });
        }
    });

    // Edit own text message within 15 minutes
    socket.on("message:edit", async ({ messageId, text }, callback) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
            const msg = await Message.findById(messageId);
            if (!msg) return;

            if (msg.sender.toString() !== senderId.toString()) {
                if (callback) callback({ error: "Can only edit your own messages" });
                return;
            }

            const diffMinutes = (Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60);
            if (diffMinutes > 15) {
                if (callback) callback({ error: "Editing window expired (15 minutes limit)" });
                return;
            }

            msg.editHistory.push({ text: msg.text, at: new Date() });
            msg.text = text;
            msg.editedAt = new Date();
            await msg.save();

            const targetRoom = msg.conversation.type === "group"
                ? `group:${msg.conversation.group.toString()}`
                : msg.conversation.peer
                    ? msg.conversation.peer.toString()
                    : msg.sender.toString();

            io.to(targetRoom).emit("message:edit", { messageId, text: msg.text, editedAt: msg.editedAt });
            if (msg.conversation.type === "dm") {
                io.to(msg.sender.toString()).emit("message:edit", { messageId, text: msg.text, editedAt: msg.editedAt });
            }

            if (callback) callback({ status: "ok", message: msg });
        } catch (error) {
            console.error("message:edit Error:", error);
            if (callback) callback({ error: error.message });
        }
    });

    // Delete message ("me" or "everyone")
    socket.on("message:delete", async ({ messageId, scope }, callback) => {
        try {
            if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
            const msg = await Message.findById(messageId);
            if (!msg) return;

            if (scope === "me") {
                if (!msg.deletedFor.includes(senderId)) {
                    msg.deletedFor.push(senderId);
                    await msg.save();
                }
                socket.emit("message:delete", { messageId, scope: "me" });
            } else if (scope === "everyone") {
                const isOwn = msg.sender.toString() === senderId.toString();
                let isAdmin = false;

                if (msg.conversation.type === "group") {
                    const group = await Group.findById(msg.conversation.group);
                    if (group) {
                        const p = group.participants.find(p => p.user.toString() === senderId.toString());
                        if (p && (p.role === "admin" || p.role === "owner")) {
                            isAdmin = true;
                        }
                    }
                }

                const diffHours = (Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60 * 60);
                if (!isOwn && !isAdmin) {
                    if (callback) callback({ error: "Not authorized to delete this message for everyone" });
                    return;
                }
                if (isOwn && diffHours > 48 && !isAdmin) {
                    if (callback) callback({ error: "Deletion window expired (48 hours limit)" });
                    return;
                }

                msg.deletedForEveryoneAt = new Date();
                msg.text = "This message was deleted";
                msg.attachments = [];
                await msg.save();

                const targetRoom = msg.conversation.type === "group"
                    ? `group:${msg.conversation.group.toString()}`
                    : msg.conversation.peer
                        ? msg.conversation.peer.toString()
                        : msg.sender.toString();

                io.to(targetRoom).emit("message:delete", { messageId, scope: "everyone", deletedForEveryoneAt: msg.deletedForEveryoneAt });
                if (msg.conversation.type === "dm") {
                    io.to(msg.sender.toString()).emit("message:delete", { messageId, scope: "everyone", deletedForEveryoneAt: msg.deletedForEveryoneAt });
                }
            }

            if (callback) callback({ status: "ok" });
        } catch (error) {
            console.error("message:delete Error:", error);
            if (callback) callback({ error: error.message });
        }
    });
};

module.exports = { registerMessageHandlers };
