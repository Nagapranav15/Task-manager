const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const userRoutes = require("../routes/userRoutes");
const { createTestUser, withAuth, assertNoSensitiveUserFields } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("userController & User Routes Matrix Tests", () => {
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

    it("GET /api/users - 200 Admin & Member, 401 Unauth, and no sensitive user fields leaked", async () => {
        // Admin gets 200
        const adminReq = withAuth(request(app).get("/api/users"), adminToken);
        const adminRes = await adminReq;
        expect(adminRes.statusCode).toEqual(200);
        expect(Array.isArray(adminRes.body)).toBe(true);
        assertNoSensitiveUserFields(adminRes.body);

        // Unauth gets 401
        const unauthRes = await request(app).get("/api/users");
        expect(unauthRes.statusCode).toEqual(401);

        // Member gets 200 and no sensitive user fields
        const memberReq = withAuth(request(app).get("/api/users"), memberToken);
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(200);
        assertNoSensitiveUserFields(memberRes.body);
    });

    it("GET /api/users/:id - 200 for user details & no sensitive fields leaked", async () => {
        const req = withAuth(request(app).get(`/api/users/${memberUser._id}`), adminToken);
        const res = await req;

        expect(res.statusCode).toEqual(200);
        assertNoSensitiveUserFields(res.body);
    });

    it("PUT /api/users/:id/role - 200 Admin, 403 Member attempting role update", async () => {
        // Member trying to promote self -> 403
        const memberReq = withAuth(
            request(app).put(`/api/users/${memberUser._id}/role`).send({ role: "admin" }),
            memberToken
        );
        const memberRes = await memberReq;
        expect(memberRes.statusCode).toEqual(403);

        // Admin promoting member -> 200
        const adminReq = withAuth(
            request(app).put(`/api/users/${memberUser._id}/role`).send({ role: "manager" }),
            adminToken
        );
        const adminRes = await adminReq;
        expect(adminRes.statusCode).toEqual(200);
        assertNoSensitiveUserFields(adminRes.body);
    });
});
