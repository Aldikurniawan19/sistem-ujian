import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/states";
import {
  MonitorClient,
  type MonitorParticipantRow,
} from "@/features/monitoring/components/monitor-client";
import type { AttemptStatus } from "@/types/domain";

export default async function ExamMonitorPage({
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
      token: true,
      creatorId: true,
      maxViolations: true,
      subject: { select: { name: true } },
      _count: { select: { questions: true } },
      classrooms: {
        select: {
          classroom: {
            select: {
              name: true,
              students: {
                where: { role: "STUDENT", isActive: true },
                orderBy: { name: "asc" },
                select: { id: true, name: true, username: true },
              },
            },
          },
        },
      },
      attempts: {
        select: {
          id: true,
          studentId: true,
          status: true,
          violationCount: true,
          submittedAt: true,
          answers: {
            select: { answerJson: true },
          },
          violations: {
            orderBy: { createdAt: "desc" },
            select: { id: true, type: true, detail: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!exam || (user.role !== "ADMIN" && exam.creatorId !== user.id)) {
    notFound();
  }

  const attemptByStudent = new Map(exam.attempts.map((a) => [a.studentId, a]));

  const participants: MonitorParticipantRow[] = [];
  for (const ec of exam.classrooms) {
    for (const s of ec.classroom.students) {
      const attempt = attemptByStudent.get(s.id);
      const answeredCount = attempt
        ? attempt.answers.filter(
            (a) =>
              a.answerJson !== null &&
              a.answerJson !== '""' &&
              a.answerJson !== "[]"
          ).length
        : 0;

      participants.push({
        studentId: s.id,
        studentName: s.name,
        username: s.username,
        classroomName: ec.classroom.name,
        attemptId: attempt?.id ?? null,
        status: attempt ? (attempt.status as AttemptStatus) : "NOT_STARTED",
        answeredCount,
        totalQuestions: exam._count.questions,
        violationCount: attempt?.violationCount ?? 0,
        violations:
          attempt?.violations.map((v) => ({
            id: v.id,
            type: v.type,
            detail: v.detail,
            createdAt: v.createdAt.toISOString(),
          })) ?? [],
        submittedAt: attempt?.submittedAt?.toISOString() ?? null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Monitoring Live · Token ${exam.token}`}
        title={exam.title}
        description={`${exam.subject.name} · Pantau progres pengerjaan, log pelanggaran, dan intervensi sesi peserta secara real-time.`}
        actions={
          <>
            <Link href="/teacher/exams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Jadwal Ujian
              </Button>
            </Link>
            <Link href={`/teacher/exams/${exam.id}/results`}>
              <Button size="sm">
                <BarChart3 className="h-4 w-4" strokeWidth={2} />
                Hasil &amp; Koreksi
              </Button>
            </Link>
          </>
        }
      />

      <MonitorClient
        participants={participants}
        maxViolations={exam.maxViolations}
      />
    </div>
  );
}
