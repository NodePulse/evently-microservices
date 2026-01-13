import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

interface TicketCodeParams {
  eventId: string;
  userId: string;
  registrationId: string;
  name: string;
}

export function generateTicketCode({
  eventId,
  userId,
  registrationId,
  name,
}: TicketCodeParams): string {
  const secret = process.env.TICKET_SECRET || "default-secret-key-change-me"; // Should be in env

  const payload = `${eventId}|${userId}|${registrationId}|${name}`;

  // Generate the full hash but processing it efficiently
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest();

  let bits = 0;
  let value = 0;
  let output = "";
  const length = 10;

  // Process bytes only until we have the desired length
  for (let i = 0; i < hmac.length && output.length < length; i++) {
    value = (value << 8) | hmac[i];
    bits += 8;

    while (bits >= 5 && output.length < length) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  return `TCK-${output}`;
}
