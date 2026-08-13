const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Group = require("../model/Group");
const Message = require("../model/Message");
const User = require("../model/User");

const migrate = async () => {
    try {
        console.log("[Migration] Connecting to DB...");
        await connectDB();

        console.log("[Migration] Step 1: Migrating Groups...");
        const rawGroupsCollection = mongoose.connection.collection("groups");
        const legacyGroups = await rawGroupsCollection.find({}).toArray();

        for (const g of legacyGroups) {
            let creatorId = g.createdBy;
            if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
                // Fallback to first admin user if invalid creator
                const firstUser = await User.findOne({ role: "admin" }) || await User.findOne({});
                creatorId = firstUser ? firstUser._id : new mongoose.Types.ObjectId();
            }

            const participantsMap = new Map();
            participantsMap.set(creatorId.toString(), {
                user: creatorId,
                role: "owner",
                joinedAt: g.createdAt || new Date(),
                addedBy: creatorId
            });

            if (Array.isArray(g.members)) {
                for (const mId of g.members) {
                    if (mId && mongoose.Types.ObjectId.isValid(mId)) {
                        const mStr = mId.toString();
                        if (!participantsMap.has(mStr)) {
                            participantsMap.set(mStr, {
                                user: mId,
                                role: "member",
                                joinedAt: g.createdAt || new Date(),
                                addedBy: creatorId
                            });
                        }
                    }
                }
            }

            const participants = Array.from(participantsMap.values());

            await rawGroupsCollection.updateOne(
                { _id: g._id },
                {
                    $set: {
                        name: g.name || "Group",
                        description: g.description || "",
                        avatarUrl: g.avatarUrl || "",
                        createdBy: creatorId,
                        participants: participants,
                        settings: {
                            whoCanSendMessages: "all",
                            whoCanEditInfo: "all",
                            whoCanAddParticipants: "all",
                            disappearingMessagesSeconds: null
                        },
                        isDeleted: false,
                        deletedAt: null
                    },
                    $unset: { members: 1, groupId: 1 }
                }
            );
        }
        console.log(`[Migration] Updated ${legacyGroups.length} groups.`);

        console.log("[Migration] Step 2: Dropping legacy createdAt TTL index on Message if exists...");
        try {
            await Message.collection.dropIndex("createdAt_1");
            console.log("[Migration] Dropped legacy createdAt_1 TTL index.");
        } catch (e) {
            console.log("[Migration] No legacy createdAt_1 TTL index found or already dropped.");
        }

        console.log("[Migration] Step 3: Migrating Messages...");
        const rawMessagesCollection = mongoose.connection.collection("messages");
        const legacyMessages = await rawMessagesCollection.find({}).toArray();

        // Get or create "General" group as a standard Group document if needed
        let generalGroup = await Group.findOne({ name: "General" });
        if (!generalGroup) {
            const adminUser = await User.findOne({ role: "admin" }) || await User.findOne({});
            const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
            const allUsers = await User.find({}).select("_id");
            generalGroup = await Group.create({
                name: "General",
                description: "Company-wide general announcement and chat channel",
                createdBy: adminId,
                participants: allUsers.map(u => ({
                    user: u._id,
                    role: u._id.toString() === adminId.toString() ? "owner" : "member",
                    joinedAt: new Date(),
                    addedBy: adminId
                })),
                settings: {
                    whoCanSendMessages: "all",
                    whoCanEditInfo: "admins",
                    whoCanAddParticipants: "admins",
                    disappearingMessagesSeconds: null
                }
            });
            console.log("[Migration] Created General group:", generalGroup._id);
        }

        for (const m of legacyMessages) {
            let conv = { type: "dm", group: null, peer: null };
            let msgType = "text";

            if (m.receiver && mongoose.Types.ObjectId.isValid(m.receiver)) {
                conv = { type: "dm", group: null, peer: m.receiver };
            } else {
                // Group message
                let targetGroupObjId = generalGroup._id;
                if (m.group && mongoose.Types.ObjectId.isValid(m.group)) {
                    targetGroupObjId = new mongoose.Types.ObjectId(m.group);
                }
                conv = { type: "group", group: targetGroupObjId, peer: null };
            }

            const attachments = [];
            if (m.fileUrl) {
                attachments.push({
                    url: m.fileUrl,
                    name: m.fileName || "file",
                    mime: m.fileType || "application/octet-stream",
                    size: 0
                });
                if (m.fileType && m.fileType.startsWith("image/")) msgType = "image";
                else if (m.fileType && m.fileType.startsWith("video/")) msgType = "video";
                else if (m.fileType && m.fileType.startsWith("audio/")) msgType = "audio";
                else msgType = "document";
            }

            const deliveries = [];
            if (m.status === "read" && m.receiver) {
                deliveries.push({
                    user: m.receiver,
                    readAt: m.updatedAt || new Date()
                });
            }

            await rawMessagesCollection.updateOne(
                { _id: m._id },
                {
                    $set: {
                        conversation: conv,
                        type: msgType,
                        text: m.text || "",
                        attachments: attachments,
                        deliveries: deliveries,
                        reactions: m.reactions || [],
                        replyTo: null,
                        forwardedFrom: null,
                        forwardScore: 0,
                        mentions: [],
                        mentionsEveryone: false,
                        editedAt: null,
                        editHistory: [],
                        deletedForEveryoneAt: null,
                        deletedFor: [],
                        expiresAt: null
                    },
                    $unset: { receiver: 1, group: 1, fileUrl: 1, fileName: 1, fileType: 1, status: 1 }
                }
            );
        }
        console.log(`[Migration] Updated ${legacyMessages.length} messages.`);
        console.log("[Migration] Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("[Migration Error]:", err);
        process.exit(1);
    }
};

migrate();
