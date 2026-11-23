import { describe, expect, it } from "vitest";
import {
  calculateScorePercent,
  gradeObjectiveAnswer,
  normalizeShortAnswer,
  parseAnswerJson,
  parseOptionsJson,
} from "@/lib/scoring";

describe("scoring engine", () => {
  it("should award full points when SINGLE_CHOICE answer matches correct option", () => {
    const result = gradeObjectiveAnswer(
      {
        type: "SINGLE_CHOICE",
        points: 20,
        options: [
          { id: "a", label: "A", text: "10", isCorrect: false },
          { id: "b", label: "B", text: "25", isCorrect: true },
        ],
        acceptedAnswers: [],
      },
      "b"
    );

    expect(result).toEqual({
      isAutoGraded: true,
      isCorrect: true,
      earnedPoints: 20,
    });
  });

  it("should award zero points when SINGLE_CHOICE answer is empty or wrong", () => {
    const question = {
      type: "SINGLE_CHOICE" as const,
      points: 15,
      options: [
        { id: "a", label: "A", text: "Benar", isCorrect: true },
        { id: "b", label: "B", text: "Salah", isCorrect: false },
      ],
      acceptedAnswers: [],
    };

    expect(gradeObjectiveAnswer(question, "b").earnedPoints).toBe(0);
    expect(gradeObjectiveAnswer(question, null).earnedPoints).toBe(0);
    expect(gradeObjectiveAnswer(question, "").earnedPoints).toBe(0);
  });

  it("should award full and partial credit properly for MULTIPLE_CHOICE (PGK)", () => {
    const question = {
      type: "MULTIPLE_CHOICE" as const,
      points: 20,
      options: [
        { id: "a", label: "A", text: "Faktor 1", isCorrect: true },
        { id: "b", label: "B", text: "Pengecoh", isCorrect: false },
        { id: "c", label: "C", text: "Faktor 2", isCorrect: true },
      ],
      acceptedAnswers: [],
    };

    expect(gradeObjectiveAnswer(question, ["a", "c"])).toEqual({
      isAutoGraded: true,
      isCorrect: true,
      earnedPoints: 20,
    });

    // 1 of 2 correct, 0 wrong => 50% partial credit
    expect(gradeObjectiveAnswer(question, ["a"])).toEqual({
      isAutoGraded: true,
      isCorrect: false,
      earnedPoints: 10,
    });

    // 1 correct + 1 wrong => clamped to 0
    expect(gradeObjectiveAnswer(question, ["a", "b"]).earnedPoints).toBe(0);
  });

  it("should normalize whitespace and casing when grading SHORT_ANSWER", () => {
    const question = {
      type: "SHORT_ANSWER" as const,
      points: 10,
      options: [],
      acceptedAnswers: ["Tesis", "Pernyataan Pendapat"],
    };

    expect(normalizeShortAnswer("  Pernyataan   PENDAPAT ")).toBe(
      "pernyataan pendapat"
    );
    expect(gradeObjectiveAnswer(question, "  TESIS ").isCorrect).toBe(true);
    expect(
      gradeObjectiveAnswer(question, "pernyataan   pendapat").earnedPoints
    ).toBe(10);
    expect(gradeObjectiveAnswer(question, "orientasi").isCorrect).toBe(false);
  });

  it("should defer ESSAY questions for manual teacher grading", () => {
    const result = gradeObjectiveAnswer(
      {
        type: "ESSAY",
        points: 25,
        options: [],
        acceptedAnswers: [],
      },
      "Menurut saya gawai perlu diatur penggunaannya di kelas."
    );

    expect(result).toEqual({
      isAutoGraded: false,
      isCorrect: null,
      earnedPoints: null,
    });
  });

  it("should compute percentage safely including zero maxScore edge case", () => {
    expect(calculateScorePercent(85, 100)).toBe(85);
    expect(calculateScorePercent(2, 3)).toBe(66.7);
    expect(calculateScorePercent(10, 0)).toBe(0);
  });

  it("should safely parse malformed JSON payloads without throwing", () => {
    expect(parseOptionsJson("{bad json")).toEqual([]);
    expect(parseAnswerJson("{bad json")).toBeNull();
    expect(parseAnswerJson(JSON.stringify(["a", "c"]))).toEqual(["a", "c"]);
  });
});
