const request = require("supertest");
const express = require("express");
const User = require("../model/User");
const Task = require("../model/Task");
const taskRoutes = require("../routes/taskRoutes");
const { createTestUser, withAuth, assertNoSensitiveUserFields } = require("./helpers/testHelpers");

jest.mock("../utils/email", () => ({
    sendTaskAssignmentEmail: jest.fn().mockResolvedValue(true),
    sendTaskStatusUpdateEmail: jest.fn().mockResolvedValue(true),
    sendOtpEmail: jest.fn().mockResolvedValue(true)
}));
jest.mock("../utils/googleCalendar", () => ({ createGoogleTodo: jest.fn().mockResolvedValue(null) }));

const app = express();
app.use(express.json());
app.use("/api/tasks", taskRoutes);

describe("taskController & Task Routes Matrix Tests", () => {
    let adminUser, adminToken, memberUser, memberToken, otherUser, otherToken, sampleTask;

    beforeEach(async () => {
        await Task.deleteMany({});
        await User.deleteMany({});

        const adminRes = await createTestUser("admin");
        adminUser = adminRes.user;
        adminToken = adminRes.token;

        const memberRes = await createTestUser("member");
        memberUser = memberRes.user;
        memberToken = memberRes.token;

        const otherRes = await createTestUser("member");
        otherUser = otherRes.user;
        otherToken = otherRes.token;

        sampleTask = await Task.create({
            title: "Sample Test Task",
            description: "Test task description",
            createdBy: adminUser._id,
            assignedTo: [memberUser._id],
            priority: "High",
            dueDate: new Date(Date.now() + 86400000)
        });
    });

    it("GET /api/tasks - 200 Authorized, 401 Unauth", async () => {
        const authReq = withAuth(request(app).get("/api/tasks"), memberToken);
        const authRes = await authReq;
        expect(authRes.statusCode).toEqual(200);
        expect(authRes.body.tasks).toBeDefined();

        const unauthRes = await request(app).get("/api/tasks");
        expect(unauthRes.statusCode).toEqual(401);
    });

    it("GET /api/tasks/:id - 200 Assigned member, 403 Non-assigned member", async () => {
        const assignedReq = withAuth(request(app).get(`/api/tasks/${sampleTask._id}`), memberToken);
        const assignedRes = await assignedReq;
        expect(assignedRes.statusCode).toEqual(200);

        const unassignedReq = withAuth(request(app).get(`/api/tasks/${sampleTask._id}`), otherToken);
        const unassignedRes = await unassignedReq;
        expect(unassignedRes.statusCode).toEqual(403);
    });

    it("PUT /api/tasks/:id/status - 200 Assignee update status, 403 Non-assignee", async () => {
        const assigneeReq = withAuth(
            request(app).put(`/api/tasks/${sampleTask._id}/status`).send({ status: "In Progress" }),
            memberToken
        );
        const assigneeRes = await assigneeReq;
        expect(assigneeRes.statusCode).toEqual(200);

        const nonAssigneeReq = withAuth(
            request(app).put(`/api/tasks/${sampleTask._id}/status`).send({ status: "Completed" }),
            otherToken
        );
        const nonAssigneeRes = await nonAssigneeReq;
        expect(nonAssigneeRes.statusCode).toEqual(403);
    });

    it("POST /api/tasks - 201 Admin create task, 403 Member create task (if adminOrManager only)", async () => {
        const adminCreateReq = withAuth(
            request(app).post("/api/tasks").send({
                title: "New Task Created",
                description: "Description",
                assignedTo: [memberUser._id.toString()],
                priority: "Medium",
                dueDate: new Date(Date.now() + 86400000)
            }),
            adminToken
        );
        const adminCreateRes = await adminCreateReq;
        expect(adminCreateRes.statusCode).toEqual(201);

        const memberCreateReq = withAuth(
            request(app).post("/api/tasks").send({
                title: "Member Created Task",
                description: "Description",
                assignedTo: [memberUser._id.toString()]
            }),
            memberToken
        );
        const memberCreateRes = await memberCreateReq;
        expect(memberCreateRes.statusCode).toEqual(403);
    });
});
