const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../model/User");
const Group = require("../model/Group");
const Message = require("../model/Message");
const chatRoutes = require("../routes/chatRoutes");

const app = express();
app.use(express.json());
app.use("/api/chat", chatRoutes);

describe("Group Lifecycle API Endpoints", () => {
    let ownerToken, memberToken, nonMemberToken;
    let ownerUser, memberUser, nonMemberUser;
    let testGroup;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }

        try {
            await Group.collection.dropIndex("groupId_1");
        } catch (e) {}

        // Create test users

        ownerUser = await User.create({
            name: "Owner Test User",
            email: `owner_${Date.now()}@test.com`,
            password: "password123",
            role: "admin"
        });

        memberUser = await User.create({
            name: "Member Test User",
            email: `member_${Date.now()}@test.com`,
            password: "password123",
            role: "member"
        });

        nonMemberUser = await User.create({
            name: "NonMember Test User",
            email: `nonmember_${Date.now()}@test.com`,
            password: "password123",
            role: "member"
        });


        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        ownerToken = jwt.sign({ id: ownerUser._id }, secret, { expiresIn: "1h" });
        memberToken = jwt.sign({ id: memberUser._id }, secret, { expiresIn: "1h" });
        nonMemberToken = jwt.sign({ id: nonMemberUser._id }, secret, { expiresIn: "1h" });
    });

    afterAll(async () => {
        if (ownerUser) await User.deleteOne({ _id: ownerUser._id });
        if (memberUser) await User.deleteOne({ _id: memberUser._id });
        if (nonMemberUser) await User.deleteOne({ _id: nonMemberUser._id });
        if (testGroup) await Group.deleteOne({ _id: testGroup._id });
        await mongoose.connection.close();
    });

    it("1. Unauthorized Path: Should return 401 when no token is provided", async () => {
        const res = await request(app).get("/api/chat/groups");
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toMatch(/not authorized/i);
    });

    it("2. Authorized Path: Owner should create a new group successfully", async () => {
        const res = await request(app)
            .post("/api/chat/groups")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                name: "Supertest Demo Group",
                description: "Group for supertest suite",
                participants: [memberUser._id.toString()]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toEqual("Supertest Demo Group");
        expect(res.body.participants).toHaveLength(2);
        testGroup = res.body;
    });

    it("3. Authorized Path: Member should fetch group info by ID", async () => {
        const res = await request(app)
            .get(`/api/chat/groups/${testGroup._id}`)
            .set("Authorization", `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual("Supertest Demo Group");
    });

    it("4. Not-a-member Path: Non-member accessing group info should get 403", async () => {
        const res = await request(app)
            .get(`/api/chat/groups/${testGroup._id}`)
            .set("Authorization", `Bearer ${nonMemberToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/not a member/i);
    });

    it("5. Admin Promotion: Owner should promote member to admin", async () => {
        const res = await request(app)
            .post(`/api/chat/groups/${testGroup._id}/participants/${memberUser._id}/promote`)
            .set("Authorization", `Bearer ${ownerToken}`);

        expect(res.statusCode).toEqual(200);
        const promoted = res.body.participants.find((p) => p.user._id === memberUser._id.toString() || p.user === memberUser._id.toString());
        expect(promoted.role).toEqual("admin");
    });

    it("6. Settings Restriction: Regular member trying to update settings should fail if restricted", async () => {
        // Demote member first
        await request(app)
            .post(`/api/chat/groups/${testGroup._id}/participants/${memberUser._id}/demote`)
            .set("Authorization", `Bearer ${ownerToken}`);

        const res = await request(app)
            .patch(`/api/chat/groups/${testGroup._id}/settings`)
            .set("Authorization", `Bearer ${memberToken}`)
            .send({ whoCanSendMessages: "admins" });

        expect(res.statusCode).toEqual(403);
    });
});
