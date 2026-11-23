import { describe, expect, it } from "vitest";
import { createClassroomSchema } from "@/features/master-data/schemas";
import { createQuestionSchema } from "@/features/question-bank/schemas";
import { createExamSchema } from "@/features/exams/schemas";
import { startExamSchema } from "@/features/exam-session/schemas";
import { gradeEssaySchema } from "@/features/grading/schemas";

describe("domain Zod schemas", () => {
  it("should reject classroom grade mismatched with SMP/SMA school level", () => {
    const invalid = createClassroomSchema.safeParse({
      name: "X-A",
      level: "SMP",
      grade: 10,
      academicYear: "2026/2027",
    });
    expect(invalid.success).toBe(false);

    const valid = createClassroomSchema.safeParse({
      name: "XI-IPA-1",
      level: "SMA",
      grade: 11,
      academicYear: "2026/2027",
    });
    expect(valid.success).toBe(true);
  });

  it("should enforce exact single correct option for SINGLE_CHOICE and reject unsafe image paths", () => {
    const noCorrect = createQuestionSchema.safeParse({
      subjectId: "sub1",
      type: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      prompt: "Berapakah hasil dari 5 + 5?",
      points: 10,
      options: [
        { id: "a", label: "A", text: "9", isCorrect: false },
        { id: "b", label: "B", text: "10", isCorrect: false },
      ],
    });
    expect(noCorrect.success).toBe(false);

    const unsafeImg = createQuestionSchema.safeParse({
      subjectId: "sub1",
      type: "ESSAY",
      difficulty: "HARD",
      prompt: "Jelaskan hukum Newton II beserta contohnya.",
      imagePath: "javascript:alert(1)",
      points: 20,
    });
    expect(unsafeImg.success).toBe(false);
  });

  it("should reject exam schedules where endAt is before startAt", () => {
    const res = createExamSchema.safeParse({
      title: "Ujian Fisika",
      category: "PTS",
      subjectId: "sub1",
      durationMinutes: 60,
      startAt: "2026-11-25T10:00",
      endAt: "2026-11-25T09:00",
      classroomIds: ["cls1"],
      questionIds: ["q1"],
    });
    expect(res.success).toBe(false);
  });

  it("should normalize and validate 6-character exam tokens", () => {
    const valid = startExamSchema.safeParse({ examId: "e1", token: "aksara" });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.token).toBe("AKSARA");
    }

    expect(startExamSchema.safeParse({ examId: "e1", token: "123" }).success).toBe(
      false
    );
  });

  it("should reject negative essay grading scores", () => {
    expect(
      gradeEssaySchema.safeParse({ attemptAnswerId: "a1", earnedPoints: -5 }).success
    ).toBe(false);
  });
});
