import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseAnswerJson } from "@/lib/scoring";
import {
  buildStudentQuestions,
  finalizeAttempt,
} from "@/features/exam-session/service";
import {
  ExamWorkspace,
  type InitialAnswerState,
} from "@/features/exam-session/components/exam-workspace";

export default async function ActiveExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}): Promise<React.JSX.Element> {
  const student = await requireRole(["STUDENT"]);
  const { attemptId } = await params;

  const attempt = await db.examAttempt.findFirst({
    where: {
      id: attemptId,
      studentId: student.id,
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      violationCount: true,
      questionOrderJson: true,
      optionOrdersJson: true,
      exam: {
        select: {
          title: true,
          maxViolations: true,
          subject: { select: { name: true } },
          questions: {
            select: {
              pointsOverride: true,
              question: {
                select: {
                  id: true,
                  type: true,
                  difficulty: true,
                  stimulus: true,
                  prompt: true,
                  imagePath: true,
                  optionsJson: true,
                  points: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          questionId: true,
          answerJson: true,
          isFlagged: true,
        },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  if (attempt.status === "SUBMITTED") {
    redirect(`/exam/${attempt.id}/result`);
  }

  if (attempt.status === "LOCKED") {
    redirect("/dashboard");
  }

  const remainingSeconds = Math.floor(
    (attempt.expiresAt.getTime() - Date.now()) / 1000
  );

  if (remainingSeconds <= 0) {
    await finalizeAttempt(attempt.id, "SUBMITTED");
    redirect(`/exam/${attempt.id}/result`);
  }

  const safeQuestions = buildStudentQuestions(
    attempt.exam.questions,
    attempt.questionOrderJson,
    attempt.optionOrdersJson
  );

  const initialAnswers: Record<string, InitialAnswerState> = {};
  for (const row of attempt.answers) {
    initialAnswers[row.questionId] = {
      answer: parseAnswerJson(row.answerJson),
      isFlagged: row.isFlagged,
    };
  }

  return (
    <ExamWorkspace
      attemptId={attempt.id}
      examTitle={attempt.exam.title}
      subjectName={attempt.exam.subject.name}
      studentName={student.name}
      studentUsername={student.username}
      initialRemainingSeconds={remainingSeconds}
      initialViolationCount={attempt.violationCount}
      maxViolations={attempt.exam.maxViolations}
      questions={safeQuestions}
      initialAnswers={initialAnswers}
    />
  );
}
