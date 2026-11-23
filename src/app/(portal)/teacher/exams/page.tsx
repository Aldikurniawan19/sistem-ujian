import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/states";
import { ExamManagerClient } from "@/features/exams/components/exam-manager-client";
import type { ExamCategory, ExamStatus, QuestionType } from "@/types/domain";

export default async function TeacherExamsPage(): Promise<React.JSX.Element> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const [exams, subjects, classrooms, questions] = await Promise.all([
    db.exam.findMany({
      where: user.role === "TEACHER" ? { creatorId: user.id } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        durationMinutes: true,
        startAt: true,
        endAt: true,
        token: true,
        status: true,
        subject: { select: { name: true } },
        classrooms: { select: { classroom: { select: { name: true } } } },
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    db.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    db.classroom.findMany({
      orderBy: [{ level: "asc" }, { grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true, level: true },
    }),
    db.question.findMany({
      where: user.role === "TEACHER" ? { authorId: user.id } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subjectId: true,
        prompt: true,
        type: true,
        points: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manajemen Asesmen"
        title="Jadwal Ujian & Token Sesi"
        description="Atur jadwal ujian per kelas SMP/SMA, tampilkan token 6 karakter dalam mode proyektor, dan buka panel pengawasan live."
      />
      <ExamManagerClient
        exams={exams.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category as ExamCategory,
          subjectName: e.subject.name,
          durationMinutes: e.durationMinutes,
          startAt: e.startAt.toISOString(),
          endAt: e.endAt.toISOString(),
          token: e.token,
          status: e.status as ExamStatus,
          classrooms: e.classrooms.map((c) => c.classroom.name),
          questionCount: e._count.questions,
          attemptCount: e._count.attempts,
        }))}
        options={{
          subjects,
          classrooms,
          questions: questions.map((q) => ({
            id: q.id,
            subjectId: q.subjectId,
            prompt: q.prompt,
            type: q.type as QuestionType,
            points: q.points,
          })),
        }}
      />
    </div>
  );
}
