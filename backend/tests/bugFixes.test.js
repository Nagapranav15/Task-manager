const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const authRoutes = require("../routes/authRoutes");
const taskRoutes = require("../routes/taskRoutes");
const { protect } = require("../middlewares/authMiddleware");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

describe("Four Bug Fixes Verification Tests", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("1. GET /api/tasks/does-not-exist returns 404 quickly without collection scan", async () => {
        const start = Date.now();
        const res = await request(app).get("/api/tasks/does-not-exist-invalid-id");
        const duration = Date.now() - start;

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toMatch(/task not found/i);
        expect(duration).toBeLessThan(1000); // Should resolve in under 1 second
    });

    it("2. POST /api/auth/login with empty body {} returns 400 with field-level message", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/provide email and password/i);
    });

    it("3. POST /api/auth/register with empty body {} returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBeDefined();
    });

    it("4. POST /api/auth/google with empty body {} returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/google")
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/google token/i);
    });
});
