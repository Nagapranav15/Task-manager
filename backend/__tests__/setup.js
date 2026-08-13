const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = "your_jwt_secret_key";
jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URL = uri;
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
