import "server-only";
import { db } from "@/lib/db";
import {
  gradeObjectiveAnswer,
  parseAcceptedAnswersJson,
  parseAnswerJson,
  parseOptionsJson,
} from "@/lib/scoring";
import type { QuestionType } from "@/types/domain";
export { buildStudentQuestions } from "@/features/exam-session/student-mapper";

export async function finalizeAttempt(
  attemptId: string,
  targetStatus: "SUBMITTED" | "LOCKED" = "SUBMITTED"
): Promise<{
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
}> {
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      exam: {
        select: {
          questions: {
            select: {
              pointsOverride: true,
              question: {
                select: {
                  id: true,
                  type: true,
                  points: true,
                  optionsJson: true,
                  acceptedAnswersJson: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          id: true,
          questionId: true,
          answerJson: true,
          earnedPoints: true,
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Sesi ujian tidak ditemukan.");
  }

  const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

  let autoScore = 0;
  let manualScore = 0;
  let maxScore = 0;

  for (const eq of attempt.exam.questions) {
    const q = eq.question;
    const points = eq.pointsOverride ?? q.points;
    maxScore += points;

    const studentAnswerRow = answerMap.get(q.id);
    const parsedAnswer = parseAnswerJson(studentAnswerRow?.answerJson ?? null);

    if (q.type === "ESSAY") {
      manualScore += studentAnswerRow?.earnedPoints ?? 0;
      continue;
    }

    const graded = gradeObjectiveAnswer(
      {
        type: q.type as QuestionType,
        points,
        options: parseOptionsJson(q.optionsJson),
        acceptedAnswers: parseAcceptedAnswersJson(q.acceptedAnswersJson),
      },
      parsedAnswer
    );

    const earned = graded.earnedPoints ?? 0;
    autoScore += earned;

    if (studentAnswerRow) {
      await db.attemptAnswer.update({
        where: { id: studentAnswerRow.id },
        data: {
          isCorrect: graded.isCorrect,
          earnedPoints: earned,
        },
      });
    } else {
      await db.attemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: q.id,
          answerJson: null,
          isFlagged: false,
          isCorrect: false,
          earnedPoints: 0,
        },
      });
    }
  }

  const totalScore = Math.round((autoScore + manualScore) * 100) / 100;

  await db.examAttempt.update({
    where: { id: attempt.id },
    data: {
      status: targetStatus,
      submittedAt: new Date(),
      autoScore,
      manualScore,
      totalScore,
      maxScore,
    },
  });

  return { autoScore, manualScore, totalScore, maxScore };
}
