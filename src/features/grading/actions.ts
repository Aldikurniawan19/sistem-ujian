"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { gradeEssaySchema } from "@/features/grading/schemas";
import type { ActionResult } from "@/types/domain";

export async function gradeEssayAnswerAction(
  input: unknown
): Promise<ActionResult<{ totalScore: number }>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = gradeEssaySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Skor esai tidak valid.",
    };
  }

  const answerRow = await db.attemptAnswer.findUnique({
    where: { id: parsed.data.attemptAnswerId },
    select: {
      id: true,
      attemptId: true,
      questionId: true,
      question: { select: { type: true, points: true } },
      attempt: {
        select: {
          id: true,
          examId: true,
          autoScore: true,
          exam: {
            select: {
              creatorId: true,
              questions: {
                select: { questionId: true, pointsOverride: true },
              },
            },
          },
        },
      },
    },
  });

  if (!answerRow || answerRow.question.type !== "ESSAY") {
    return { success: false, error: "Jawaban esai tidak ditemukan." };
  }

  if (actor.role !== "ADMIN" && answerRow.attempt.exam.creatorId !== actor.id) {
    return { success: false, error: "Anda tidak memiliki izin menilai ujian ini." };
  }

  const eq = answerRow.attempt.exam.questions.find(
    (item) => item.questionId === answerRow.questionId
  );
  const maxPoints = eq?.pointsOverride ?? answerRow.question.points;
  if (parsed.data.earnedPoints > maxPoints) {
    return {
      success: false,
      error: `Skor tidak boleh melebihi bobot maksimal soal (${maxPoints} poin).`,
    };
  }

  await db.attemptAnswer.update({
    where: { id: answerRow.id },
    data: {
      earnedPoints: parsed.data.earnedPoints,
      isCorrect: parsed.data.earnedPoints >= maxPoints * 0.6,
      teacherFeedback: parsed.data.teacherFeedback || null,
    },
  });

  const allEssayAnswers = await db.attemptAnswer.findMany({
    where: {
      attemptId: answerRow.attemptId,
      question: { type: "ESSAY" },
    },
    select: { earnedPoints: true },
  });

  const manualScore = allEssayAnswers.reduce(
    (sum, item) => sum + (item.earnedPoints ?? 0),
    0
  );
  const totalScore =
    Math.round((answerRow.attempt.autoScore + manualScore) * 100) / 100;

  await db.examAttempt.update({
    where: { id: answerRow.attemptId },
    data: {
      manualScore,
      totalScore,
    },
  });

  revalidatePath(`/teacher/exams/${answerRow.attempt.examId}/results`);
  return { success: true, data: { totalScore } };
}
