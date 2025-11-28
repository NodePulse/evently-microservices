/**
 * Test script to demonstrate encryption/decryption
 * Run with: node test-encryption.js
 */

import crypto from "crypto";
// Configuration (should match your .env)
const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET || "default-32-character-secret-key";
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || "default-16-char-iv";

// Create key and IV
const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
const iv = crypto.createHash("md5").update(ENCRYPTION_IV).digest();

/**
 * Encrypt data
 */
function encrypt(data) {
  const text = JSON.stringify(data);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

/**
 * Decrypt data
 */
function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

/**
 * Create encrypted response (like the API Gateway does)
 */
function createEncryptedResponse(data) {
  return {
    encrypted: true,
    data: encrypt(data),
    timestamp: Date.now(),
  };
}

// Test the encryption
console.log("=== Encryption Test ===\n");

const testData = {
  id: "123",
  email: "user@example.com",
  username: "johndoe",
  message: "Registration successful",
};

console.log("Original Data:");
console.log(JSON.stringify(testData, null, 2));
console.log();

const encryptedResponse = createEncryptedResponse(testData);
console.log("Encrypted Response (what API Gateway sends):");
console.log(JSON.stringify(encryptedResponse, null, 2));
console.log();

const decryptedData = decrypt(encryptedResponse.data);
console.log("Decrypted Data (what client receives after decryption):");
console.log(JSON.stringify(decryptedData, null, 2));
console.log();

// Verify data integrity
const isMatch = JSON.stringify(testData) === JSON.stringify(decryptedData);
console.log(`Data integrity check: ${isMatch ? "✅ PASSED" : "❌ FAILED"}`);
