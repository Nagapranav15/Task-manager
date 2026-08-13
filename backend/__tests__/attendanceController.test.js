const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const Attendance = require("../model/Attendance");
const attendanceRoutes = require("../routes/attendanceRoutes");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/attendance", attendanceRoutes);

describe("attendanceController & Attendance Routes Matrix Tests", () => {
    let adminUser, adminToken, memberUser, memberToken;

    beforeEach(async () => {
        await Attendance.deleteMany({});
        await User.deleteMany({});

        const adminRes = await createTestUser("admin");
        adminUser = adminRes.user;
        adminToken = adminRes.token;

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;
    });

    it("GET /api/attendance/my-logs - 200 Member, 401 Unauth", async () => {
        const req = withAuth(request(app).get("/api/attendance/my-logs"), memberToken);
        const res = await req;
        expect(res.statusCode).toEqual(200);

        const unauthRes = await request(app).get("/api/attendance/my-logs");
        expect(unauthRes.statusCode).toEqual(401);
    });

    it("GET /api/attendance/admin/all-logs - 200 Admin, 403 Member", async () => {
        const adminReq = withAuth(request(app).get("/api/attendance/admin/all-logs"), adminToken);
        const adminRes = await adminReq;
        expect(adminRes.statusCode).toEqual(200);

        const memberReq = withAuth(request(app).get("/api/attendance/admin/all-logs"), memberToken);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(403);
    });
});
