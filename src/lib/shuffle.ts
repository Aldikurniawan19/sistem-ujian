import { randomInt } from "crypto";

// Unambiguous uppercase alphanumeric characters (excludes O, 0, I, 1, L)
const TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateExamToken(length = 6): string {
  let token = "";
  for (let i = 0; i < length; i += 1) {
    const idx = randomInt(0, TOKEN_ALPHABET.length);
    token += TOKEN_ALPHABET[idx] ?? "A";
  }
  return token;
}

/**
 * Deterministic Fisher-Yates shuffle using a numeric seed derived from string.
 * Does not mutate the input array.
 */
export function deterministicShuffle<T>(items: readonly T[], seedKey: string): T[] {
  const result = [...items];
  let state = hashSeed(seedKey);

  for (let i = result.length - 1; i > 0; i -= 1) {
    state = nextPrng(state);
    const j = state % (i + 1);
    const current = result[i];
    const target = result[j];
    if (current !== undefined && target !== undefined) {
      result[i] = target;
      result[j] = current;
    }
  }

  return result;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextPrng(state: number): number {
  let t = (state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0);
}
