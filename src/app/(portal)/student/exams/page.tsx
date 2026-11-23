import Link from "next/link";
import { ClipboardList, Clock, FileQuestion, Play } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateScorePercent } from "@/lib/scoring";
import { formatDateTimeID } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared/states";
import { EXAM_CATEGORY_LABELS, type ExamCategory } from "@/types/domain";

export default async function StudentExamsPage(): Promise<React.JSX.Element> {
  const student = await requireRole(["STUDENT"]);
  const now = new Date();

  const exams = student.classroomId
    ? await db.exam.findMany({
        where: {
          status: "PUBLISHED",
          classrooms: { some: { classroomId: student.classroomId } },
        },
        orderBy: { startAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          durationMinutes: true,
          startAt: true,
          endAt: true,
          showResultToStudent: true,
          subject: { select: { name: true, code: true } },
          _count: { select: { questions: true } },
          attempts: {
            where: { studentId: student.id },
            select: {
              id: true,
              status: true,
              totalScore: true,
              maxScore: true,
              submittedAt: true,
            },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Jadwal Peserta · Kelas ${student.classroomName ?? "-"}`}
        title="Daftar Ujian Anda"
        description="Pilih ujian yang sedang dibuka untuk memasukkan token 6 karakter atau tinjau riwayat pengerjaan."
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada jadwal ujian"
          description="Belum ada jadwal ujian yang ditugaskan untuk kelas Anda."
        />
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const attempt = exam.attempts[0];
            const isOpen = exam.startAt <= now && exam.endAt >= now;
            return (
              <Card key={exam.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="brand">{exam.subject.name}</Badge>
                      <Badge variant="neutral">
                        {EXAM_CATEGORY_LABELS[exam.category as ExamCategory] ?? exam.category}
                      </Badge>
                      {attempt?.status === "SUBMITTED" && (
                        <Badge variant="success">Selesai</Badge>
                      )}
                      {attempt?.status === "IN_PROGRESS" && (
                        <Badge variant="warning">Sedang Berjalan</Badge>
                      )}
                      {attempt?.status === "LOCKED" && (
                        <Badge variant="danger">Terkunci</Badge>
                      )}
                    </div>
                    <h2 className="text-base font-semibold text-[#141413]">
                      {exam.title}
                    </h2>
                    {exam.description && (
                      <p className="text-xs text-[#575652]">{exam.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#575652]">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
                        {exam.durationMinutes} menit
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <FileQuestion className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
                        {exam._count.questions} soal
                      </span>
                      <span>
                        Dibuka: {formatDateTimeID(exam.startAt)} –{" "}
                        {formatDateTimeID(exam.endAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {attempt?.status === "SUBMITTED" ? (
                      <>
                        {exam.showResultToStudent && (
                          <p className="font-mono text-sm font-semibold tabular-nums text-[#141413]">
                            Skor:{" "}
                            {calculateScorePercent(attempt.totalScore, attempt.maxScore)}
                          </p>
                        )}
                        <Link href={`/exam/${attempt.id}/result`}>
                          <Button variant="outline" size="sm">
                            Lihat Bukti &amp; Hasil
                          </Button>
                        </Link>
                      </>
                    ) : attempt?.status === "IN_PROGRESS" ? (
                      <Link href={`/exam/${attempt.id}`}>
                        <Button size="sm">
                          <Play className="h-3.5 w-3.5" strokeWidth={2} />
                          Lanjutkan Ujian
                        </Button>
                      </Link>
                    ) : attempt?.status === "LOCKED" ? (
                      <Badge variant="danger">Hubungi Pengawas</Badge>
                    ) : isOpen ? (
                      <Link href={`/student/exams/${exam.id}/confirm`}>
                        <Button size="sm">
                          <Play className="h-3.5 w-3.5" strokeWidth={2} />
                          Masukkan Token
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled variant="secondary" size="sm">
                        Di Luar Jadwal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
