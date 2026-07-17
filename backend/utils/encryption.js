const crypto = require("crypto");

// Secret key must be 32 bytes (256 bits)
// We use JWT_SECRET and pad/slice it to be exactly 32 bytes
const rawKey = process.env.JWT_SECRET || "default_fallback_secret_task_tracker";
const ENCRYPTION_KEY = Buffer.alloc(32);
Buffer.from(rawKey, "utf8").copy(ENCRYPTION_KEY);

const IV_LENGTH = 16; // AES uses 16 bytes IV

function encrypt(buffer) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return encrypted;
}

function decrypt(buffer) {
    const iv = buffer.subarray(0, IV_LENGTH);
    const encryptedData = buffer.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
}

module.exports = { encrypt, decrypt };
