const request = require("supertest");
const express = require("express");
const cors = require("cors");

const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "https://task-manager-topaz-pi.vercel.app",
    "https://tasks-tracker.thinklabdigitalsolutions.com"
];

const envOrigins = [
    process.env.ALLOWED_ORIGINS,
    process.env.CLIENT_URLS,
    process.env.CLIENT_URL
]
    .filter(Boolean)
    .flatMap(str => str.split(","))
    .map(url => url.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

const app = express();
app.use(cors(corsOptions));
app.get("/api/test-cors", (req, res) => {
    res.status(200).json({ ok: true });
});

describe("CORS Configuration Security Tests", () => {
    it("1. Request with malicious origin (https://evil.example) receives NO Access-Control-Allow-Origin header", async () => {
        const res = await request(app)
            .get("/api/test-cors")
            .set("Origin", "https://evil.example");

        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("2. Request with allowed origin (http://localhost:5173) receives correct Access-Control headers", async () => {
        const res = await request(app)
            .get("/api/test-cors")
            .set("Origin", "http://localhost:5173");

        expect(res.headers["access-control-allow-origin"]).toEqual("http://localhost:5173");
        expect(res.headers["access-control-allow-credentials"]).toEqual("true");
    });

    it("3. Request with Vercel frontend origin receives correct Access-Control headers", async () => {
        const res = await request(app)
            .get("/api/test-cors")
            .set("Origin", "https://task-manager-topaz-pi.vercel.app");

        expect(res.headers["access-control-allow-origin"]).toEqual("https://task-manager-topaz-pi.vercel.app");
        expect(res.headers["access-control-allow-credentials"]).toEqual("true");
    });

    it("4. Preflight OPTIONS request returns successful status with CORS headers", async () => {
        const res = await request(app)
            .options("/api/test-cors")
            .set("Origin", "http://localhost:5173")
            .set("Access-Control-Request-Method", "POST");

        expect([200, 204]).toContain(res.statusCode);
        expect(res.headers["access-control-allow-origin"]).toEqual("http://localhost:5173");
        expect(res.headers["access-control-allow-credentials"]).toEqual("true");
    });
});
