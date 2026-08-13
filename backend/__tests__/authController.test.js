const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const authRoutes = require("../routes/authRoutes");
const { createTestUser, withAuth, assertNoSensitiveUserFields } = require("./helpers/testHelpers");

jest.mock("../utils/email", () => ({ sendOtpEmail: jest.fn().mockResolvedValue(true) }));

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("authController & Auth Routes Matrix Tests", () => {
    let testUser, token;

    beforeEach(async () => {
        await User.deleteMany({});
        const res = await createTestUser("member");
        testUser = res.user;
        token = res.token;
    });

    it("POST /api/auth/register - 200 success & no sensitive fields in response", async () => {
        const email = `reg_${Date.now()}@thinklabdigitalsolutions.com`;
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "New Registered User",
                email,
                password: "Password123!"
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.token).toBeDefined();
        assertNoSensitiveUserFields(res.body);
    });

    it("POST /api/auth/register - 400 for empty body", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBeDefined();
    });

    it("POST /api/auth/login - 200 success & no sensitive fields in response", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .set("X-Forwarded-For", "192.168.1.1")
            .send({
                email: testUser.email,
                password: "Password123!"
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeDefined();
        assertNoSensitiveUserFields(res.body);
    });

    it("POST /api/auth/login - 400 for missing body fields", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .set("X-Forwarded-For", "192.168.1.2")
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/provide email and password/i);
    });

    it("GET /api/auth/profile - 200 authorized & 401 unauthorized", async () => {
        const authReq = withAuth(request(app).get("/api/auth/profile"), token);
        const authRes = await authReq;
        expect(authRes.statusCode).toEqual(200);
        assertNoSensitiveUserFields(authRes.body);

        const unauthRes = await request(app).get("/api/auth/profile");
        expect(unauthRes.statusCode).toEqual(401);
    });

    it("POST /api/auth/forgot-password & reset-password end-to-end flow with bcrypt hashed OTP", async () => {
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .set("X-Forwarded-For", "192.168.1.3")
            .send({ email: testUser.email });

        expect(forgotRes.statusCode).toEqual(200);

        const rawOtp = "654321";
        const hashedOtp = await bcrypt.hash(rawOtp, 10);

        await User.findByIdAndUpdate(testUser._id, {
            resetOtp: hashedOtp,
            resetOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
            otpAttempts: 0
        });

        const newPass = "ResetPass123!";
        const resetRes = await request(app)
            .post("/api/auth/reset-password")
            .set("X-Forwarded-For", "192.168.1.4")
            .send({
                email: testUser.email,
                otp: rawOtp,
                newPassword: newPass
            });

        expect(resetRes.statusCode).toEqual(200);

        // Verify old login password changed
        const loginRes = await request(app)
            .post("/api/auth/login")
            .set("X-Forwarded-For", "192.168.1.5")
            .send({
                email: testUser.email,
                password: newPass
            });

        expect(loginRes.statusCode).toEqual(200);
    });

    it("OTP verification lockout: 5 failed attempts wipe OTP and lock account", async () => {
        const rawOtp = "123456";
        const hashedOtp = await bcrypt.hash(rawOtp, 10);

        await User.findByIdAndUpdate(testUser._id, {
            loginOtp: hashedOtp,
            loginOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
            otpAttempts: 0
        });

        for (let i = 1; i <= 5; i++) {
            const wrongRes = await request(app)
                .post("/api/auth/login-otp-verify")
                .set("X-Forwarded-For", `10.0.1.${i}`)
                .send({ email: testUser.email, otp: "000000" });

            expect(wrongRes.statusCode).toEqual(400);
        }

        const dbUser = await User.findById(testUser._id).select("+loginOtp +loginOtpExpiry +otpAttempts");
        expect(dbUser.loginOtp).toBeNull();
        expect(dbUser.loginOtpExpiry).toBeNull();

        // Valid OTP now fails because OTP was wiped on 5th failure
        const retryRes = await request(app)
            .post("/api/auth/login-otp-verify")
            .set("X-Forwarded-For", "10.0.1.99")
            .send({ email: testUser.email, otp: rawOtp });

        expect(retryRes.statusCode).toEqual(400);
    });
});
