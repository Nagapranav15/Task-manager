const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../model/User");
const Task = require("../model/Task");
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const taskRoutes = require("../routes/taskRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

describe("Backend Security & Authorization Defect Tests", () => {
    let adminUser, memberUser, assigneeUser, unassignedUser;
    let adminToken, memberToken, assigneeToken, unassignedToken;
    let sampleTask;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }

        const domain = "thinklabdigitalsolutions.com";
        const ts = Date.now();

        adminUser = await User.create({
            name: "Sec Admin",
            email: `admin_${ts}@${domain}`,
            password: "Password123!",
            role: "admin"
        });

        memberUser = await User.create({
            name: "Sec Member",
            email: `member_${ts}@${domain}`,
            password: "Password123!",
            role: "member"
        });

        assigneeUser = await User.create({
            name: "Sec Assignee",
            email: `assignee_${ts}@${domain}`,
            password: "Password123!",
            role: "member"
        });

        unassignedUser = await User.create({
            name: "Sec Unassigned",
            email: `unassigned_${ts}@${domain}`,
            password: "Password123!",
            role: "member"
        });

        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        adminToken = jwt.sign({ id: adminUser._id }, secret, { expiresIn: "1h" });
        memberToken = jwt.sign({ id: memberUser._id }, secret, { expiresIn: "1h" });
        assigneeToken = jwt.sign({ id: assigneeUser._id }, secret, { expiresIn: "1h" });
        unassignedToken = jwt.sign({ id: unassignedUser._id }, secret, { expiresIn: "1h" });

        sampleTask = await Task.create({
            title: "Security Verification Task",
            description: "Task for supertest security checks",
            priority: "Medium",
            dueDate: new Date(Date.now() + 86400000),
            createdBy: adminUser._id,
            assignedTo: [assigneeUser._id]
        });
    });

    afterAll(async () => {
        if (adminUser) await User.deleteOne({ _id: adminUser._id });
        if (memberUser) await User.deleteOne({ _id: memberUser._id });
        if (assigneeUser) await User.deleteOne({ _id: assigneeUser._id });
        if (unassignedUser) await User.deleteOne({ _id: unassignedUser._id });
        if (sampleTask) await Task.deleteOne({ _id: sampleTask._id });
        await mongoose.connection.close();
    });

    it("1. Defect 1: GET /api/users does not leak loginOtp, resetOtp, loginOtpExpiry, resetOtpExpiry", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);

        res.body.forEach((u) => {
            expect(u.loginOtp).toBeUndefined();
            expect(u.resetOtp).toBeUndefined();
            expect(u.loginOtpExpiry).toBeUndefined();
            expect(u.resetOtpExpiry).toBeUndefined();
        });
    });

    it("2. Defect 1: GET /api/users/:id does not leak OTP fields", async () => {
        const res = await request(app)
            .get(`/api/users/${adminUser._id}`)
            .set("Authorization", `Bearer ${memberToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.loginOtp).toBeUndefined();
        expect(res.body.resetOtp).toBeUndefined();
        expect(res.body.loginOtpExpiry).toBeUndefined();
        expect(res.body.resetOtpExpiry).toBeUndefined();
    });

    it("3. Defect 1: Password reset flow works end-to-end with select: false", async () => {
        // Forgot password
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: memberUser.email });

        expect(forgotRes.statusCode).toEqual(200);

        // Fetch user from DB explicitly selecting resetOtp
        const dbUser = await User.findById(memberUser._id).select("+resetOtp +resetOtpExpiry");
        expect(dbUser.resetOtp).toBeDefined();

        // Reset password
        const newPass = "NewStrongPass123!";
        const resetRes = await request(app)
            .post("/api/auth/reset-password")
            .send({
                email: memberUser.email,
                otp: dbUser.resetOtp,
                newPassword: newPass
            });

        expect(resetRes.statusCode).toEqual(200);

        // Login with new password
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: memberUser.email,
                password: newPass
            });

        expect(loginRes.statusCode).toEqual(200);
        expect(loginRes.body.token).toBeDefined();
    });

    it("4. Defect 2: Token signed for a deleted user gets 401, not 500", async () => {
        const tempUser = await User.create({
            name: "Temp Deleted User",
            email: `deleted_${Date.now()}@thinklabdigitalsolutions.com`,
            password: "password123",
            role: "member"
        });

        const secret = process.env.JWT_SECRET || "default_jwt_secret";
        const tempToken = jwt.sign({ id: tempUser._id }, secret, { expiresIn: "1h" });

        await tempUser.deleteOne();

        const res = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", `Bearer ${tempToken}`);

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toMatch(/user no longer exists/i);
    });

    it("5. Defect 3: GET /api/tasks/:id enforces authorization (403 unassigned, 200 assignee & admin)", async () => {
        // Unassigned member -> 403
        const unassignedRes = await request(app)
            .get(`/api/tasks/${sampleTask._id}`)
            .set("Authorization", `Bearer ${unassignedToken}`);

        expect(unassignedRes.statusCode).toEqual(403);
        expect(unassignedRes.body.message).toMatch(/not authorized/i);

        // Assignee -> 200
        const assigneeRes = await request(app)
            .get(`/api/tasks/${sampleTask._id}`)
            .set("Authorization", `Bearer ${assigneeToken}`);

        expect(assigneeRes.statusCode).toEqual(200);
        expect(assigneeRes.body.title).toEqual(sampleTask.title);

        // Admin -> 200
        const adminRes = await request(app)
            .get(`/api/tasks/${sampleTask._id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(adminRes.statusCode).toEqual(200);
    });

    it("6. Defect 4: PUT /api/auth/profile with new email leaves stored email unchanged", async () => {
        const originalEmail = memberUser.email;
        const res = await request(app)
            .put("/api/auth/profile")
            .set("Authorization", `Bearer ${memberToken}`)
            .send({
                name: "Updated Sec Member",
                email: "hacker@gmail.com"
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(originalEmail);

        const checkDb = await User.findById(memberUser._id);
        expect(checkDb.email).toEqual(originalEmail);
        expect(checkDb.name).toEqual("Updated Sec Member");
    });

    it("7. Defect 5: GET /api/auth/google/calendar-init returns 401 without token and 403 for non-admin", async () => {
        // No token -> 401
        const noTokenRes = await request(app).get("/api/auth/google/calendar-init");
        expect(noTokenRes.statusCode).toEqual(401);

        // Non-admin token -> 403
        const nonAdminRes = await request(app)
            .get("/api/auth/google/calendar-init")
            .set("Authorization", `Bearer ${memberToken}`);

        expect(nonAdminRes.statusCode).toEqual(403);
    });
});
