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

describe("Chat & Message API Endpoints", () => {
    let userA, userB, userC;
    let tokenA, tokenB, tokenC;
    let testGroup, testMessage;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }

        userA = await User.create({
            name: "User A",
            email: `usera_${Date.now()}@test.com`,
            password: "password123",
            role: "member"
        });

        userB = await User.create({
            name: "User B",
            email: `userb_${Date.now()}@test.com`,
            password: "password123",
            role: "member"
        });

        userC = await User.create({
            name: "User C",
            email: `userc_${Date.now()}@test.com`,
            password: "password123",
            role: "member"
        });

        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        tokenA = jwt.sign({ id: userA._id }, secret, { expiresIn: "1h" });
        tokenB = jwt.sign({ id: userB._id }, secret, { expiresIn: "1h" });
        tokenC = jwt.sign({ id: userC._id }, secret, { expiresIn: "1h" });

        testGroup = await Group.create({
            name: "Chat Test Group",
            createdBy: userA._id,
            participants: [
                { user: userA._id, role: "owner" },
                { user: userB._id, role: "member" }
            ]
        });

        testMessage = await Message.create({
            conversation: { type: "group", group: testGroup._id },
            sender: userA._id,
            type: "text",
            text: "Hello team from supertest"
        });
    });

    afterAll(async () => {
        if (userA) await User.deleteOne({ _id: userA._id });
        if (userB) await User.deleteOne({ _id: userB._id });
        if (userC) await User.deleteOne({ _id: userC._id });
        if (testGroup) await Group.deleteOne({ _id: testGroup._id });
        if (testMessage) await Message.deleteOne({ _id: testMessage._id });
        await mongoose.connection.close();
    });

    it("1. Authorized Path: Group member should fetch group message history", async () => {
        const res = await request(app)
            .get(`/api/chat/messages?conversationType=group&conversationId=${testGroup._id}`)
            .set("Authorization", `Bearer ${tokenA}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("2. Not-a-member Path: Non-group member fetching group messages should get 403", async () => {
        const res = await request(app)
            .get(`/api/chat/messages?conversationType=group&conversationId=${testGroup._id}`)
            .set("Authorization", `Bearer ${tokenC}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/access denied/i);
    });

    it("3. Search Messages: Member should search text query", async () => {
        const res = await request(app)
            .get("/api/chat/search?q=supertest")
            .set("Authorization", `Bearer ${tokenA}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.messages).toBeDefined();
    });
});
