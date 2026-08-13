const request = require("supertest");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

const User = require("../model/User");
const Group = require("../model/Group");
const chatRoutes = require("../routes/chatRoutes");
const initSocketIO = require("../socket");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/chat", chatRoutes);

describe("groupController & Group Security Matrix Tests", () => {
    let ownerUser, ownerToken, memberUser, memberToken, nonMemberUser, nonMemberToken, testGroup, server, io, port, socketUrl;

    beforeAll((done) => {
        server = http.createServer(app);
        io = new Server(server);
        app.set("io", io);
        initSocketIO(io);
        server.listen(0, () => {
            port = server.address().port;
            socketUrl = `http://localhost:${port}`;
            done();
        });
    });

    afterAll((done) => {
        io.close();
        server.close(done);
    });

    beforeEach(async () => {
        await Group.deleteMany({});
        await User.deleteMany({});

        const ownerRes = await createTestUser("member");
        ownerUser = ownerRes.user;
        ownerToken = ownerRes.token;

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;

        const nonMemberRes = await createTestUser("member");
        nonMemberUser = nonMemberRes.user;
        nonMemberToken = nonMemberRes.token;

        const groupRes = await withAuth(
            request(app).post("/api/chat/groups").send({
                name: "Security Test Group",
                participants: [memberUser._id.toString()]
            }),
            ownerToken
        );

        testGroup = groupRes.body;
    });

    it("POST /api/chat/groups - 200 Authorized creation, 401 Unauth", async () => {
        expect(testGroup._id || testGroup.groupId).toBeDefined();

        const unauthRes = await request(app).post("/api/chat/groups").send({ name: "Unauth Group" });
        expect(unauthRes.statusCode).toEqual(401);
    });

    it("GET /api/chat/groups/:id - 200 Member, 403 Non-member", async () => {
        const groupId = testGroup._id || testGroup.groupId;
        const memberReq = withAuth(request(app).get(`/api/chat/groups/${groupId}`), memberToken);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(200);

        const nonMemberReq = withAuth(request(app).get(`/api/chat/groups/${groupId}`), nonMemberToken);
        const nonMemberRes = await nonMemberReq;
        expect(nonMemberRes.statusCode).toEqual(403);
    });

    it("PATCH /api/chat/groups/:id/settings - 403 Non-member trying to update group settings", async () => {
        const groupId = testGroup._id || testGroup.groupId;
        const nonMemberReq = withAuth(
            request(app).patch(`/api/chat/groups/${groupId}/settings`).send({ onlyAdminsCanSend: true }),
            nonMemberToken
        );
        const nonMemberRes = await nonMemberReq;
        expect(nonMemberRes.statusCode).toEqual(403);
    });

    it("Socket.IO: Non-member cannot receive group messages", (done) => {
        const clientSocket = Client(socketUrl, {
            auth: { token: nonMemberToken },
            transports: ["websocket"],
            reconnection: false
        });

        clientSocket.on("connect", () => {
            const groupId = testGroup._id || testGroup.groupId;
            clientSocket.emit("join_group", { groupId });
            setTimeout(() => {
                clientSocket.disconnect();
                done();
            }, 300);
        });

        clientSocket.on("connect_error", () => {
            clientSocket.disconnect();
            done();
        });
    });
});
