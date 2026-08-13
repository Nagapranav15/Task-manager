const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../model/User");
const Group = require("../model/Group");
const Message = require("../model/Message");
const authRoutes = require("../routes/authRoutes");
const { serveAuthenticatedFile } = require("../middlewares/fileAuthMiddleware");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/uploads", serveAuthenticatedFile);

describe("File Serving & Upload Security Tests", () => {
    let groupMemberUser, nonMemberUser;
    let memberToken, nonMemberToken;
    let testGroup, sampleMsg;
    let chatFilesDir, testFileName, testFileRelativePath;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }

        const domain = "thinklabdigitalsolutions.com";
        const ts = Date.now();

        groupMemberUser = await User.create({
            name: "File Group Member",
            email: `filemember_${ts}@${domain}`,
            password: "Password123!",
            role: "member"
        });

        nonMemberUser = await User.create({
            name: "File Non Member",
            email: `filenonmember_${ts}@${domain}`,
            password: "Password123!",
            role: "member"
        });

        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        memberToken = jwt.sign({ id: groupMemberUser._id }, secret, { expiresIn: "1h" });
        nonMemberToken = jwt.sign({ id: nonMemberUser._id }, secret, { expiresIn: "1h" });

        testGroup = await Group.create({
            name: "Secret File Group",
            createdBy: groupMemberUser._id,
            participants: [{ user: groupMemberUser._id, role: "owner", joinedAt: new Date() }]
        });

        // Ensure physical test file exists under uploads/chat-files/
        chatFilesDir = path.join(__dirname, "../uploads/chat-files");
        if (!fs.existsSync(chatFilesDir)) {
            fs.mkdirSync(chatFilesDir, { recursive: true });
        }

        testFileName = `sec-test-${ts}.txt`;
        const fullFilePath = path.join(chatFilesDir, testFileName);
        fs.writeFileSync(fullFilePath, "Secret chat content");
        testFileRelativePath = `chat-files/${testFileName}`;

        sampleMsg = await Message.create({
            conversation: {
                type: "group",
                group: testGroup._id
            },
            sender: groupMemberUser._id,
            type: "document",
            text: "Here is the sensitive file",

            attachments: [{
                url: `http://localhost:8080/uploads/${testFileRelativePath}`,
                name: testFileName,
                type: "text/plain",
                size: 20
            }]
        });
    });

    afterAll(async () => {
        if (groupMemberUser) await User.deleteOne({ _id: groupMemberUser._id });
        if (nonMemberUser) await User.deleteOne({ _id: nonMemberUser._id });
        if (testGroup) await Group.deleteOne({ _id: testGroup._id });
        if (sampleMsg) await Message.deleteOne({ _id: sampleMsg._id });

        const fullFilePath = path.join(chatFilesDir, testFileName);
        if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
        }

        await mongoose.connection.close();
    });

    it("1. Fetching an attachment URL with no Authorization header returns 401", async () => {
        const res = await request(app).get(`/uploads/${testFileRelativePath}`);
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toMatch(/not authorized/i);
    });

    it("2. Fetching another group's attachment as a non-member returns 403", async () => {
        const res = await request(app)
            .get(`/uploads/${testFileRelativePath}`)
            .set("Authorization", `Bearer ${nonMemberToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/access denied/i);
    });

    it("2b. Group member can access the group attachment", async () => {
        const res = await request(app)
            .get(`/uploads/${testFileRelativePath}`)
            .set("Authorization", `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual("Secret chat content");
    });

    it("3. Path traversal attack ..%2f..%2f.env returns 400", async () => {
        const res = await request(app).get("/uploads/..%2f..%2f.env");
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/invalid file path/i);
    });

    it("4. POST /api/auth/upload-image with no token returns 401", async () => {
        const res = await request(app)
            .post("/api/auth/upload-image")
            .attach("image", Buffer.from("fake png"), "avatar.png");

        expect(res.statusCode).toEqual(401);
    });

    it("5. POST /api/auth/upload-image with .html or .svg payload is rejected (400)", async () => {
        const htmlRes = await request(app)
            .post("/api/auth/upload-image")
            .set("Authorization", `Bearer ${memberToken}`)
            .attach("image", Buffer.from("<script>alert(1)</script>"), {
                filename: "malicious.html",
                contentType: "text/html"
            });

        expect(htmlRes.statusCode).toEqual(400);

        const svgRes = await request(app)
            .post("/api/auth/upload-image")
            .set("Authorization", `Bearer ${memberToken}`)
            .attach("image", Buffer.from("<svg onload=alert(1)></svg>"), {
                filename: "malicious.svg",
                contentType: "image/svg+xml"
            });

        expect(svgRes.statusCode).toEqual(400);
    });

    it("6. POST /api/auth/upload-image with valid PNG and token succeeds", async () => {
        // Valid 1x1 PNG buffer
        const pngBuffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64"
        );

        const res = await request(app)
            .post("/api/auth/upload-image")
            .set("Authorization", `Bearer ${memberToken}`)
            .attach("image", pngBuffer, {
                filename: "myavatar.png",
                contentType: "image/png"
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.imageUrl).toBeDefined();
        expect(res.body.imageUrl).toMatch(/\/uploads\/avatars\//);
    });
});
