const crypto = require("crypto");

const getSecret = () => process.env.JWT_SECRET || "default_jwt_secret";

/**
 * Generates HMAC signature query parameters for short-lived image/media viewing
 */
const generateSignedFileUrl = (filePath, userId, expiresSeconds = 3600) => {
    const expiresAt = Date.now() + expiresSeconds * 1000;
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    const dataToSign = `${cleanPath}:${userId.toString()}:${expiresAt}`;
    const sig = crypto.createHmac("sha256", getSecret()).update(dataToSign).digest("hex");
    return `sig=${sig}&exp=${expiresAt}&uid=${userId.toString()}`;
};

/**
 * Verifies HMAC signature query parameters for media viewing
 */
const verifyFileSignature = (filePath, sig, exp, uid) => {
    if (!sig || !exp || !uid) return false;

    const expTime = parseInt(exp, 10);
    if (isNaN(expTime) || expTime < Date.now()) {
        return false;
    }

    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    const dataToSign = `${cleanPath}:${uid}:${exp}`;
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(dataToSign).digest("hex");

    try {
        return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
    } catch (e) {
        return false;
    }
};

module.exports = {
    generateSignedFileUrl,
    verifyFileSignature
};
