const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const reportRoutes = require("../routes/reportRoutes");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/reports", reportRoutes);

describe("reportController & Report Routes Matrix Tests", () => {
    let adminUser, adminToken, memberUser, memberToken;

    beforeEach(async () => {
        await User.deleteMany({});

        const adminRes = await createTestUser("admin");
        adminUser = adminRes.user;
        adminToken = adminRes.token;

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;
    });

    it("GET /api/reports/export/tasks - 200 Admin, 401 Unauth, 403 Member", async () => {
        const adminReq = withAuth(request(app).get("/api/reports/export/tasks"), adminToken);
        const adminRes = await adminReq;
        expect(adminRes.statusCode).toEqual(200);

        const unauthRes = await request(app).get("/api/reports/export/tasks");
        expect(unauthRes.statusCode).toEqual(401);

        const memberReq = withAuth(request(app).get("/api/reports/export/tasks"), memberToken);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(403);
    });
});
