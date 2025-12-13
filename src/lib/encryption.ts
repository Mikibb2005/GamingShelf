import crypto from "crypto";

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable
 * Uses AUTH_SECRET (32+ chars) as the base for the encryption key
 */
function getEncryptionKey(): Buffer {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET must be at least 32 characters for encryption");
    }
    // Create a 32-byte key using SHA-256 hash of the secret
    return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plaintext string (e.g., API key)
 * Returns a base64-encoded string containing IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return "";

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Ciphertext into a single base64 string
    const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, "base64")
    ]);

    return combined.toString("base64");
}

/**
 * Decrypt an encrypted string back to plaintext
 * Expects base64-encoded string containing IV + AuthTag + Ciphertext
 */
export function decrypt(encryptedData: string): string {
    if (!encryptedData) return "";

    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedData, "base64");

        // Extract IV, AuthTag, and Ciphertext
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString("utf8");
    } catch (error) {
        console.error("Decryption failed:", error);
        return "";
    }
}

/**
 * Check if a string appears to be encrypted (base64 with correct length)
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;

    try {
        const decoded = Buffer.from(value, "base64");
        // Minimum length: IV (16) + AuthTag (16) + at least 1 byte of ciphertext
        return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
        return false;
    }
}
