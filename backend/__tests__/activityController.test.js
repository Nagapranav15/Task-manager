const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const activityRoutes = require("../routes/activityRoutes");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

const app = express();
app.use(express.json());
app.use("/api/activity", activityRoutes);

describe("activityController & Activity Routes Matrix Tests", () => {
    let memberUser, memberToken;

    beforeEach(async () => {
        await User.deleteMany({});

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;
    });

    it("GET /api/activity - 200 Authorized member, 401 Unauth", async () => {
        const authReq = withAuth(request(app).get("/api/activity"), memberToken);
        const authRes = await authReq;
        expect(authRes.statusCode).toEqual(200);

        const unauthRes = await request(app).get("/api/activity");
        expect(unauthRes.statusCode).toEqual(401);
    });
});
