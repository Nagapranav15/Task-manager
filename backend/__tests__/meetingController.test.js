const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const Meeting = require("../model/Meeting");
const meetingRoutes = require("../routes/meetingRoutes");
const { createTestUser, withAuth } = require("./helpers/testHelpers");

jest.mock("../utils/googleCalendar", () => ({
    createMeetingEvent: jest.fn().mockResolvedValue("mock_event_id"),
    updateMeetingEvent: jest.fn().mockResolvedValue(true),
    deleteCalendarEvent: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use("/api/meetings", meetingRoutes);

describe("meetingController & Meeting Routes Matrix Tests", () => {
    let adminUser, adminToken, memberUser, memberToken;

    beforeEach(async () => {
        await Meeting.deleteMany({});
        await User.deleteMany({});

        const adminRes = await createTestUser("admin");
        adminUser = adminRes.user;
        adminToken = adminRes.token;

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;
    });

    it("GET /api/meetings - 200 Authorized caller, 401 Unauthorized", async () => {
        const authReq = withAuth(request(app).get("/api/meetings"), memberToken);
        const authRes = await authReq;
        expect(authRes.statusCode).toEqual(200);

        const unauthRes = await request(app).get("/api/meetings");
        expect(unauthRes.statusCode).toEqual(401);
    });

    it("POST /api/meetings - 201 Admin create meeting", async () => {
        const adminReq = withAuth(
            request(app).post("/api/meetings").send({
                title: "Team Sync Meeting",
                description: "Syncing quarterly goals",
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000),
                participants: [memberUser._id.toString()]
            }),
            adminToken
        );
        const adminRes = await adminReq;
        expect(adminRes.statusCode).toEqual(201);
    });
});
