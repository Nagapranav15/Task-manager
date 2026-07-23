import CryptoJS from "crypto-js";

/**
 * Encrypt a text string.
 * Returns standard ciphertext string.
 */
export async function encryptMessage(text, secretSeed) {
    if (!text || typeof text !== "string") return text || "";
    try {
        const cipherText = CryptoJS.AES.encrypt(text, secretSeed).toString();
        return cipherText;
    } catch (e) {
        console.error("[Encryption Error]:", e);
        return text;
    }
}

/**
 * Decrypt a ciphertext string.
 * Gracefully falls back to raw text if ciphertext is not encrypted or decryption fails.
 */
export async function decryptMessage(cipherText, secretSeed) {
    if (!cipherText || typeof cipherText !== "string") return cipherText || "";
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, secretSeed);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
            // Decryption returned empty, likely not encrypted or invalid key. Fallback to raw.
            return cipherText;
        }
        return decryptedText;
    } catch (e) {
        // Safe fallback for unencrypted messages
        return cipherText;
    }
}
