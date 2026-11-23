import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseAnswerJson } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/states";
import {
  ResultsClient,
  type EssayGradingItem,
  type ItemAnalysisRow,
  type ResultRow,
} from "@/features/grading/components/results-client";
import type { QuestionType } from "@/types/domain";

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<React.JSX.Element> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const { examId } = await params;

  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      creatorId: true,
      subject: { select: { name: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          orderIndex: true,
          pointsOverride: true,
          question: {
            select: {
              id: true,
              prompt: true,
              type: true,
              points: true,
            },
          },
        },
      },
      attempts: {
        where: { status: { in: ["SUBMITTED", "LOCKED"] } },
        orderBy: { totalScore: "desc" },
        select: {
          id: true,
          status: true,
          autoScore: true,
          manualScore: true,
          totalScore: true,
          maxScore: true,
          violationCount: true,
          submittedAt: true,
          student: {
            select: {
              name: true,
              username: true,
              classroom: { select: { name: true } },
            },
          },
          answers: {
            select: {
              id: true,
              questionId: true,
              answerJson: true,
              isCorrect: true,
              earnedPoints: true,
              teacherFeedback: true,
            },
          },
        },
      },
    },
  });

  if (!exam || (user.role !== "ADMIN" && exam.creatorId !== user.id)) {
    notFound();
  }

  const results: ResultRow[] = exam.attempts.map((a) => ({
    attemptId: a.id,
    studentName: a.student.name,
    username: a.student.username,
    classroomName: a.student.classroom?.name ?? "-",
    status: a.status,
    autoScore: a.autoScore,
    manualScore: a.manualScore,
    totalScore: a.totalScore,
    maxScore: a.maxScore,
    violationCount: a.violationCount,
    submittedAt: a.submittedAt?.toISOString() ?? null,
  }));

  const questionMetaMap = new Map(
    exam.questions.map((eq) => [
      eq.question.id,
      {
        prompt: eq.question.prompt,
        type: eq.question.type as QuestionType,
        maxPoints: eq.pointsOverride ?? eq.question.points,
      },
    ])
  );

  const essays: EssayGradingItem[] = [];
  for (const a of exam.attempts) {
    for (const ans of a.answers) {
      const meta = questionMetaMap.get(ans.questionId);
      if (!meta || meta.type !== "ESSAY") continue;
      const parsed = parseAnswerJson(ans.answerJson);
      essays.push({
        attemptAnswerId: ans.id,
        studentName: a.student.name,
        username: a.student.username,
        classroomName: a.student.classroom?.name ?? "-",
        questionPrompt: meta.prompt,
        maxPoints: meta.maxPoints,
        studentResponse: typeof parsed === "string" ? parsed : "",
        earnedPoints: ans.earnedPoints,
        teacherFeedback: ans.teacherFeedback,
      });
    }
  }

  const itemAnalysis: ItemAnalysisRow[] = exam.questions.map((eq, idx) => {
    const responses = exam.attempts
      .map((a) => a.answers.find((ans) => ans.questionId === eq.question.id))
      .filter((ans): ans is NonNullable<typeof ans> => ans !== undefined);
    const correctCount = responses.filter((r) => r.isCorrect === true).length;
    const totalResponses = responses.length;
    const correctRate =
      totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

    return {
      questionId: eq.question.id,
      orderNumber: idx + 1,
      prompt: eq.question.prompt,
      type: eq.question.type as QuestionType,
      totalResponses,
      correctCount,
      correctRate,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evaluasi & Analitik"
        title={`Hasil: ${exam.title}`}
        description={`${exam.subject.name} · Rekap nilai otomatis, koreksi manual uraian/esai, analisis butir soal, dan ekspor CSV.`}
        actions={
          <>
            <Link href="/teacher/exams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Jadwal Ujian
              </Button>
            </Link>
            <Link href={`/teacher/exams/${exam.id}/monitor`}>
              <Button variant="secondary" size="sm">
                <Activity className="h-4 w-4" strokeWidth={2} />
                Monitoring Live
              </Button>
            </Link>
          </>
        }
      />

      <ResultsClient
        examId={exam.id}
        results={results}
        essays={essays}
        itemAnalysis={itemAnalysis}
      />
    </div>
  );
}
