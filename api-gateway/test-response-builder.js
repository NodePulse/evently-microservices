/**
 * Test script to demonstrate the new ResponseBuilder pattern
 * Run with: node test-response-builder.js
 */

const crypto = require("crypto");

// Configuration (should match your .env)
const ENABLE_ENCRYPTION = process.env.ENABLE_ENCRYPTION === "true";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "your-strong-encryption-key-minimum-32-characters";
const ENCRYPTION_SALT =
  process.env.ENCRYPTION_SALT || "your-encryption-salt-16-chars";

/**
 * Encrypt data using scrypt key derivation and AES-256-CBC
 */
function encryptData(data) {
  if (!ENABLE_ENCRYPTION) {
    return data;
  }

  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), "utf8"),
      cipher.final(),
    ]);

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted.toString("hex"),
      salt: ENCRYPTION_SALT,
    };
  } catch (error) {
    console.error("Encryption failed:", error.message);
    return data;
  }
}

/**
 * Decrypt data
 */
function decryptData(encryptedPayload) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, encryptedPayload.salt, 32);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(encryptedPayload.iv, "hex")
    );

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPayload.encryptedData, "hex")),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw error;
  }
}

/**
 * Create a response using the ResponseBuilder pattern
 */
function createApiResponse(data, statusCode = 200, message = "Success") {
  const startTime = process.hrtime();
  const requestId = "test-" + Date.now();

  // Simulate processing time
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const responseTimeMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

  const STATUS_MESSAGES = {
    200: "OK",
    201: "Created",
    400: "Bad Request",
    401: "Unauthorized",
    404: "Not Found",
    500: "Internal Server Error",
    502: "Bad Gateway",
  };

  return {
    success: statusCode >= 200 && statusCode < 300,
    status: {
      code: statusCode,
      description: STATUS_MESSAGES[statusCode] || "Unknown Status",
    },
    message: message || STATUS_MESSAGES[statusCode] || "Request processed.",
    timestamp: new Date().toISOString(),
    responseTimeMs,
    requestId,
    locale: "en-US",
    data: ENABLE_ENCRYPTION ? encryptData(data) : data,
    meta: {
      apiVersion: "v1",
    },
    error: null,
    requestContext: {
      path: "/api/v1/user/auth/register",
      method: "POST",
    },
  };
}

// Test the response builder
console.log("=== ResponseBuilder Test ===\n");
console.log(
  `Encryption: ${ENABLE_ENCRYPTION ? "ENABLED ✅" : "DISABLED ❌"}\n`
);

const testData = {
  id: "123",
  email: "user@example.com",
  username: "johndoe",
  message: "Registration successful",
  createdAt: new Date().toISOString(),
};

console.log("Original Data:");
console.log(JSON.stringify(testData, null, 2));
console.log();

const apiResponse = createApiResponse(
  testData,
  200,
  "User registered successfully"
);
console.log("API Response (what API Gateway sends):");
console.log(JSON.stringify(apiResponse, null, 2));
console.log();

if (ENABLE_ENCRYPTION && apiResponse.data.encryptedData) {
  console.log("Decrypted Data:");
  const decrypted = decryptData(apiResponse.data);
  console.log(JSON.stringify(decrypted, null, 2));
  console.log();

  const isMatch = JSON.stringify(testData) === JSON.stringify(decrypted);
  console.log(`Data integrity check: ${isMatch ? "✅ PASSED" : "❌ FAILED"}`);
} else {
  console.log("Encryption is disabled, data is sent in plain format");
}

console.log("\n=== Error Response Example ===\n");

const errorResponse = {
  success: false,
  status: {
    code: 401,
    description: "Unauthorized",
  },
  message: "Authentication required",
  timestamp: new Date().toISOString(),
  responseTimeMs: 5,
  requestId: "test-error-" + Date.now(),
  locale: "en-US",
  data: null,
  meta: {
    apiVersion: "v1",
  },
  error: {
    message: "Authentication required",
    code: "UNAUTHORIZED",
    details: null,
  },
  requestContext: {
    path: "/api/v1/user/users",
    method: "GET",
  },
};

console.log("Error Response:");
console.log(JSON.stringify(errorResponse, null, 2));
