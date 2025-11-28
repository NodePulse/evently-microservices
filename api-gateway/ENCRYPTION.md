# API Gateway Response Encryption

## Overview

The API Gateway now encrypts all responses using **AES-256-CBC** encryption before sending them to clients. This adds an extra layer of security for data in transit.

## How It Works

### Server-Side (API Gateway)

1. **Encryption Service** (`src/common/encryption.service.ts`)

   - Uses AES-256-CBC algorithm
   - Encrypts all responses from microservices before sending to clients
   - Generates encryption key from `ENCRYPTION_SECRET` environment variable
   - Uses initialization vector (IV) from `ENCRYPTION_IV` environment variable

2. **Response Format**
   ```json
   {
     "encrypted": true,
     "data": "base64-encoded-encrypted-string",
     "timestamp": 1700000000000
   }
   ```

### Client-Side Decryption

A client utility is provided in `client-utils/client-decryption-utility.ts` for frontend applications.

#### Installation

```bash
npm install crypto-js
```

#### Usage Example

```typescript
import { decryptResponse } from "./client-decryption-utility";

// Make API request
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

// Get encrypted response
const encryptedData = await response.json();
console.log(encryptedData);
// Output: { encrypted: true, data: "...", timestamp: 1700000000000 }

// Decrypt the response
const decryptedData = decryptResponse(encryptedData);
console.log(decryptedData);
// Output: { id: "...", email: "user@example.com", username: "johndoe", ... }
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Encryption Configuration (AES-256)
ENCRYPTION_SECRET=your-32-character-encryption-secret-key-here
ENCRYPTION_IV=your-16-char-iv
```

**Important:**

- `ENCRYPTION_SECRET`: Should be a strong, random 32+ character string
- `ENCRYPTION_IV`: Should be a 16 character string
- **Keep these values secret and secure!**
- Use the same values in your client application for decryption

### Generating Secure Keys

You can generate secure keys using Node.js:

```javascript
const crypto = require("crypto");

// Generate encryption secret (32 bytes)
const secret = crypto.randomBytes(32).toString("hex");
console.log("ENCRYPTION_SECRET=" + secret);

// Generate IV (16 bytes)
const iv = crypto.randomBytes(16).toString("hex").substring(0, 16);
console.log("ENCRYPTION_IV=" + iv);
```

## Security Considerations

1. **Key Management**: Store encryption keys securely, never commit them to version control
2. **HTTPS**: Always use HTTPS in production for additional transport security
3. **Key Rotation**: Periodically rotate encryption keys for enhanced security
4. **Client Security**: Ensure client applications store decryption keys securely

## Testing

### Using cURL (you'll get encrypted response)

```bash
curl -X POST http://localhost:3100/api/v1/user/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

Response:

```json
{
  "encrypted": true,
  "data": "U2FsdGVkX1+...(base64 encrypted data)...",
  "timestamp": 1700000000000
}
```

### Manual Decryption (Node.js)

```javascript
const crypto = require("crypto");

const ENCRYPTION_SECRET = "your-secret-here";
const ENCRYPTION_IV = "your-iv-here";

function decrypt(encryptedData) {
  const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
  const iv = crypto.createHash("md5").update(ENCRYPTION_IV).digest();

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

// Use it
const response = { encrypted: true, data: "...", timestamp: 1700000000000 };
const decrypted = decrypt(response.data);
console.log(decrypted);
```

## Troubleshooting

### "Decryption failed" Error

- Ensure `ENCRYPTION_SECRET` and `ENCRYPTION_IV` match on both server and client
- Verify the encrypted data is not corrupted during transmission
- Check that the data format is correct (base64 string)

### Performance Considerations

- Encryption adds minimal overhead (~1-2ms per request)
- For large payloads, consider compressing data before encryption
- Monitor server CPU usage if handling high request volumes
