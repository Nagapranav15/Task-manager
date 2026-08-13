const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../model/User");
jest.mock("../utils/email", () => ({ sendOtpEmail: jest.fn().mockResolvedValue(true) }));
const authRoutes = require("../routes/authRoutes");

const { globalLimiter } = require("../middlewares/rateLimiter");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use("/api", globalLimiter);
app.use("/api/auth", authRoutes);

describe("Authentication Hardening & Rate Limiting Tests", () => {
    let testUser;
    const testDomain = "thinklabdigitalsolutions.com";
    const testEmail = `ratelimit_${Date.now()}@${testDomain}`;
    const testPassword = "Password123!";

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }

        testUser = await User.create({
            name: "RateLimit Test User",
            email: testEmail,
            password: testPassword,
            role: "member"
        });
    });

    afterAll(async () => {
        if (testUser) {
            await User.deleteOne({ _id: testUser._id });
        }
        await mongoose.connection.close();
    });

    it("1. forgot-password returns byte-identical responses for existing and non-existing email addresses", async () => {
        const realRes = await request(app)
            .post("/api/auth/forgot-password")
            .set("X-Forwarded-For", "192.168.1.100")
            .send({ email: testEmail });

        const fakeEmail = `fake_${Date.now()}@${testDomain}`;
        const fakeRes = await request(app)
            .post("/api/auth/forgot-password")
            .set("X-Forwarded-For", "192.168.1.101")
            .send({ email: fakeEmail });

        expect(realRes.statusCode).toEqual(200);
        expect(fakeRes.statusCode).toEqual(200);
        expect(JSON.stringify(realRes.body)).toEqual(JSON.stringify(fakeRes.body));
        expect(realRes.body.message).toEqual("OTP sent to your email successfully.");
    });

    it("2. Password reset happy path succeeds end-to-end with bcrypt-hashed OTP", async () => {
        // Request forgot-password
        await request(app)
            .post("/api/auth/forgot-password")
            .set("X-Forwarded-For", "192.168.1.102")
            .send({ email: testEmail });

        // Retrieve user and check hashed OTP is stored in DB
        const dbUser = await User.findById(testUser._id).select("+resetOtp +resetOtpExpiry");
        expect(dbUser.resetOtp).toBeDefined();
        expect(dbUser.resetOtp).not.toEqual("");

        // We know bcrypt hash starts with $2
        expect(dbUser.resetOtp).toMatch(/^\$2/);
    });

    it("3. Lockout counter: 5 failed OTP attempts clear the OTP so subsequent correct code fails", async () => {
        // Trigger login OTP request
        await request(app)
            .post("/api/auth/login-otp-request")
            .set("X-Forwarded-For", "192.168.1.103")
            .send({ email: testEmail });

        let dbUser = await User.findById(testUser._id).select("+loginOtp +loginOtpExpiry +otpAttempts");
        expect(dbUser.loginOtp).toBeDefined();

        // Perform 5 wrong attempts on distinct client IP to bypass IP rate limit
        for (let i = 1; i <= 5; i++) {
            const wrongRes = await request(app)
                .post("/api/auth/login-otp-verify")
                .set("X-Forwarded-For", `10.0.0.${i}`)
                .send({ email: testEmail, otp: "000000" });

            expect(wrongRes.statusCode).toEqual(400);
        }

        // Verify OTP fields are wiped from database after 5 failures
        dbUser = await User.findById(testUser._id).select("+loginOtp +loginOtpExpiry +otpAttempts");
        expect(dbUser.loginOtp).toBeNull();
        expect(dbUser.loginOtpExpiry).toBeNull();
        expect(dbUser.otpAttempts).toEqual(0);
    });

    it("4. Rate limiting: 6th request from same IP to auth endpoint returns 429 Too Many Requests", async () => {
        const clientIp = "203.0.113.42";
        const email = `limit_check_${Date.now()}@${testDomain}`;

        // Perform 5 requests from same IP
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post("/api/auth/login-otp-request")
                .set("X-Forwarded-For", clientIp)
                .send({ email });

            expect(res.statusCode).not.toEqual(429);
        }

        // 6th request from same IP -> 429
        const res6 = await request(app)
            .post("/api/auth/login-otp-request")
            .set("X-Forwarded-For", clientIp)
            .send({ email });

        expect(res6.statusCode).toEqual(429);
        expect(res6.body.message).toMatch(/too many/i);
    });
});
