import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";
import { buildCsvDocument, escapeCsvCell, parseCsvText } from "@/lib/csv";
import { deterministicShuffle, generateExamToken } from "@/lib/shuffle";
import { isSafeRelativeRedirect } from "@/lib/utils";

describe("password hashing & verification", () => {
  it("should verify valid password and reject wrong or malformed hashes", () => {
    const hash1 = hashPassword("rahasia123");
    const hash2 = hashPassword("rahasia123");

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword("rahasia123", hash1)).toBe(true);
    expect(verifyPassword("salah123", hash1)).toBe(false);
    expect(verifyPassword("rahasia123", "malformed-hash")).toBe(false);
  });
});

describe("rate limiter", () => {
  it("should block requests exceeding limit within window and recover afterwards", () => {
    resetRateLimitStore();
    const t0 = 1_000_000;

    expect(checkRateLimit("login:test", 2, 10_000, t0).allowed).toBe(true);
    expect(checkRateLimit("login:test", 2, 10_000, t0 + 1000).allowed).toBe(true);

    const blocked = checkRateLimit("login:test", 2, 10_000, t0 + 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // After window passes, allowed again
    expect(checkRateLimit("login:test", 2, 10_000, t0 + 11_000).allowed).toBe(
      true
    );
  });
});

describe("CSV export & import security", () => {
  it("should neutralize spreadsheet formula injection prefixes", () => {
    expect(escapeCsvCell("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
    expect(escapeCsvCell("+1+1")).toBe("'+1+1");
    expect(escapeCsvCell("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("should build UTF-8 BOM CSV and parse quoted rows accurately", () => {
    const csv = buildCsvDocument(
      ["NISN", "Nama"],
      [["0091234501", "Nadia, Kusuma"]]
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const parsed = parseCsvText(csv);
    expect(parsed).toEqual([
      ["NISN", "Nama"],
      ["0091234501", "Nadia, Kusuma"],
    ]);
  });
});

describe("shuffle, token generator & redirect safety", () => {
  it("should produce deterministic shuffle without mutating source array", () => {
    const original = ["q1", "q2", "q3", "q4", "q5"];
    const first = deterministicShuffle(original, "exam1:student1");
    const second = deterministicShuffle(original, "exam1:student1");

    expect(first).toEqual(second);
    expect(original).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect([...first].sort()).toEqual([...original].sort());
  });

  it("should generate 6-char unambiguous uppercase tokens", () => {
    const token = generateExamToken(6);
    expect(token).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("should prevent open redirects to external domains", () => {
    expect(isSafeRelativeRedirect("/teacher/exams")).toBe("/teacher/exams");
    expect(isSafeRelativeRedirect("https://evil.example")).toBe("/dashboard");
    expect(isSafeRelativeRedirect("//evil.example")).toBe("/dashboard");
    expect(isSafeRelativeRedirect(null)).toBe("/dashboard");
  });
});
