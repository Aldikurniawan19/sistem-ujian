import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const salt = parts[0];
  const expectedHex = parts[1];
  if (!salt || !expectedHex) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHex, "hex");
  const actualBuffer = scryptSync(password, salt, KEY_LENGTH);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
