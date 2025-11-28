# API Gateway Response Format

## Overview

The API Gateway now returns **structured, consistent responses** for all endpoints with optional **AES-256-CBC encryption** using scrypt key derivation.

## Response Structure

### Success Response

```json
{
  "success": true,
  "status": {
    "code": 200,
    "description": "OK"
  },
  "message": "Request processed successfully",
  "timestamp": "2025-11-21T23:22:57.274Z",
  "responseTimeMs": 15,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "locale": "en-US",
  "data": {
    "id": "123",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "meta": {
    "apiVersion": "v1"
  },
  "error": null,
  "requestContext": {
    "path": "/api/v1/user/auth/register",
    "method": "POST"
  }
}
```

### Error Response

```json
{
  "success": false,
  "status": {
    "code": 401,
    "description": "Unauthorized"
  },
  "message": "Authentication required",
  "timestamp": "2025-11-21T23:22:57.274Z",
  "responseTimeMs": 5,
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "locale": "en-US",
  "data": null,
  "meta": {
    "apiVersion": "v1"
  },
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED",
    "details": null
  },
  "requestContext": {
    "path": "/api/v1/user/users",
    "method": "GET"
  }
}
```

## Response Fields

| Field                | Type         | Description                                        |
| -------------------- | ------------ | -------------------------------------------------- |
| `success`            | boolean      | `true` for 2xx status codes, `false` otherwise     |
| `status.code`        | number       | HTTP status code                                   |
| `status.description` | string       | Human-readable status description                  |
| `message`            | string       | Response message                                   |
| `timestamp`          | string       | ISO 8601 timestamp                                 |
| `responseTimeMs`     | number       | Response time in milliseconds                      |
| `requestId`          | string       | Unique request identifier (UUID)                   |
| `locale`             | string       | Response locale (default: "en-US")                 |
| `data`               | any          | Response data (encrypted if encryption is enabled) |
| `meta`               | object       | Additional metadata (pagination, links, etc.)      |
| `error`              | object\|null | Error details (null for successful responses)      |
| `requestContext`     | object\|null | Request context information                        |

## Encryption

### Configuration

Add to your `.env` file:

```bash
# Enable/disable encryption
ENABLE_ENCRYPTION=true

# Encryption key (minimum 32 characters recommended)
ENCRYPTION_KEY=your-strong-encryption-key-minimum-32-characters

# Encryption salt (16 characters recommended)
ENCRYPTION_SALT=your-encryption-salt-16-chars
```

### Encrypted Response Format

When encryption is enabled (`ENABLE_ENCRYPTION=true`), the `data` field will be encrypted:

```json
{
  "success": true,
  "status": {
    "code": 200,
    "description": "OK"
  },
  "message": "Request processed successfully",
  "timestamp": "2025-11-21T23:23:03.948Z",
  "responseTimeMs": 15,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "locale": "en-US",
  "data": {
    "iv": "dd3e240c5531529d77d6f0cc6f45f809",
    "encryptedData": "1abff1b7f44959bcfac541ffb491d06e...",
    "salt": "your-encryption-salt-16-chars"
  },
  "meta": {
    "apiVersion": "v1"
  },
  "error": null,
  "requestContext": {
    "path": "/api/v1/user/auth/register",
    "method": "POST"
  }
}
```

### Decryption (Client-Side)

#### Node.js Example

```javascript
const crypto = require("crypto");

function decryptData(encryptedPayload, encryptionKey) {
  const key = crypto.scryptSync(encryptionKey, encryptedPayload.salt, 32);

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
}

// Usage
const response = await fetch(
  "http://localhost:3100/api/v1/user/auth/register",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      username: "johndoe",
      password: "password123",
    }),
  }
);

const apiResponse = await response.json();

if (apiResponse.success && apiResponse.data.encryptedData) {
  const decryptedData = decryptData(
    apiResponse.data,
    "your-strong-encryption-key-minimum-32-characters"
  );
  console.log(decryptedData);
}
```

#### Browser Example (using crypto-js)

```javascript
import CryptoJS from "crypto-js";

function decryptData(encryptedPayload, encryptionKey) {
  // Derive key using scrypt (note: crypto-js doesn't have scrypt, use a library like scrypt-js)
  // For browser, you might need to use PBKDF2 instead or use a backend proxy

  // This is a simplified example - in production, use proper scrypt implementation
  const key = CryptoJS.PBKDF2(encryptionKey, encryptedPayload.salt, {
    keySize: 256 / 32,
    iterations: 1000,
  });

  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.enc.Hex.parse(encryptedPayload.encryptedData).toString(
      CryptoJS.enc.Base64
    ),
    key,
    {
      iv: CryptoJS.enc.Hex.parse(encryptedPayload.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}
```

## Metadata Examples

### Pagination

```json
{
  "meta": {
    "apiVersion": "v1",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "links": {
      "first": "/api/v1/user/users?page=1",
      "prev": null,
      "next": "/api/v1/user/users?page=2",
      "last": "/api/v1/user/users?page=5"
    }
  }
}
```

### Deprecation Warning

```json
{
  "meta": {
    "apiVersion": "v1",
    "deprecation": {
      "message": "This endpoint will be deprecated in v2",
      "sunsetDate": "2026-01-01"
    }
  }
}
```

## Error Codes

Common error codes returned in the `error.code` field:

| Code               | Description                       |
| ------------------ | --------------------------------- |
| `UNAUTHORIZED`     | Authentication required or failed |
| `FORBIDDEN`        | User doesn't have permission      |
| `NOT_FOUND`        | Resource not found                |
| `VALIDATION_ERROR` | Request validation failed         |
| `SERVICE_ERROR`    | Microservice error                |
| `GATEWAY_ERROR`    | API Gateway error                 |

## Testing

### Test Without Encryption

```bash
node test-response-builder.js
```

### Test With Encryption

```bash
ENABLE_ENCRYPTION=true node test-response-builder.js
```

### Example cURL Request

```bash
curl -X POST http://localhost:3100/api/v1/user/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

## Best Practices

1. **Always check `success` field** before processing data
2. **Use `requestId`** for debugging and log correlation
3. **Monitor `responseTimeMs`** for performance tracking
4. **Handle encrypted responses** properly on the client side
5. **Use `error.code`** for programmatic error handling
6. **Check `meta.deprecation`** for upcoming API changes

## Security Considerations

1. **Encryption Keys**: Store `ENCRYPTION_KEY` and `ENCRYPTION_SALT` securely
2. **HTTPS**: Always use HTTPS in production
3. **Key Rotation**: Rotate encryption keys periodically
4. **Client Security**: Ensure clients store decryption keys securely
5. **Request IDs**: Don't expose sensitive information in request IDs

## Migration Guide

If you're migrating from the old response format:

**Old Format:**

```json
{
  "id": "123",
  "email": "user@example.com"
}
```

**New Format:**

```json
{
  "success": true,
  "status": { "code": 200, "description": "OK" },
  "data": {
    "id": "123",
    "email": "user@example.com"
  },
  ...
}
```

Update your client code to access `response.data` instead of the root object.
