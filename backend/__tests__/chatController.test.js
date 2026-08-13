const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const Group = require("../model/Group");
const Message = require("../model/Message");
const chatRoutes = require("../routes/chatRoutes");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/chat", chatRoutes);

describe("chatController Security & Route Matrix Tests", () => {
    let member1, token1, member2, token2, nonMember, nonToken, testGroup, groupMongoId;

    beforeAll(async () => {
        await Message.syncIndexes();
    });

    beforeEach(async () => {
        await Message.deleteMany({});
        await Group.deleteMany({});
        await User.deleteMany({});

        const res1 = await createTestUser("member");
        member1 = res1.user;
        token1 = res1.token;

        const res2 = await createTestUser("member");
        member2 = res2.user;
        token2 = res2.token;

        const res3 = await createTestUser("member");
        nonMember = res3.user;
        nonToken = res3.token;

        const groupRes = await withAuth(
            request(app).post("/api/chat/groups").send({
                name: "Chat Test Group",
                participants: [member2._id.toString()]
            }),
            token1
        );
        testGroup = groupRes.body;
        groupMongoId = testGroup._id || testGroup.groupId;

        const groupDoc = await Group.findById(groupMongoId);

        await Message.create({
            sender: member1._id,
            conversation: {
                type: "group",
                group: groupDoc._id
            },
            group: groupDoc._id.toString(),
            text: "Hello group!"
        });
    });

    it("GET /api/chat/messages - 200 Member, 403 Non-member", async () => {
        const memberReq = withAuth(request(app).get(`/api/chat/messages?group=${groupMongoId}`), token1);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(200);

        const nonMemberReq = withAuth(request(app).get(`/api/chat/messages?group=${groupMongoId}`), nonToken);
        const nonMemberRes = await nonMemberReq;
        expect(nonMemberRes.statusCode).toEqual(403);
    });

    it("GET /api/chat/search - 200 Member", async () => {
        const memberReq = withAuth(request(app).get(`/api/chat/search?q=Hello`), token2);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(200);
    });
});
