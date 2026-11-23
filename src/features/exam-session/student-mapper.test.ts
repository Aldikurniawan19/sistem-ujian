import { describe, expect, it } from "vitest";
import { buildStudentQuestions } from "@/features/exam-session/student-mapper";

describe("buildStudentQuestions security & ordering", () => {
  it("should strip isCorrect answer keys and apply persisted question and option orders", () => {
    const rawQuestions = [
      {
        pointsOverride: null,
        question: {
          id: "q1",
          type: "SINGLE_CHOICE",
          difficulty: "EASY",
          stimulus: null,
          prompt: "Pertanyaan 1",
          imagePath: null,
          points: 10,
          optionsJson: JSON.stringify([
            { id: "a", label: "A", text: "Opsi A", isCorrect: false },
            { id: "b", label: "B", text: "Opsi B", isCorrect: true },
          ]),
        },
      },
      {
        pointsOverride: 25,
        question: {
          id: "q2",
          type: "ESSAY",
          difficulty: "HARD",
          stimulus: "Wacana singkat",
          prompt: "Pertanyaan 2",
          imagePath: null,
          points: 15,
          optionsJson: null,
        },
      },
    ];

    const mapped = buildStudentQuestions(
      rawQuestions,
      JSON.stringify(["q2", "q1"]),
      JSON.stringify({ q1: ["b", "a"] })
    );

    expect(mapped).toHaveLength(2);
    expect(mapped[0]?.id).toBe("q2");
    expect(mapped[0]?.orderNumber).toBe(1);
    expect(mapped[0]?.points).toBe(25);

    const q1 = mapped[1];
    expect(q1?.id).toBe("q1");
    expect(q1?.orderNumber).toBe(2);
    expect(q1?.options[0]).toEqual({ id: "b", label: "A", text: "Opsi B" });
    expect(q1?.options[1]).toEqual({ id: "a", label: "B", text: "Opsi A" });
    // Security check: answer key must never exist on serialized student DTO
    expect(JSON.stringify(mapped)).not.toContain("isCorrect");
  });
});
