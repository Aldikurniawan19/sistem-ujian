import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileQuestion,
  Play,
  School,
  ShieldAlert,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { calculateScorePercent } from "@/lib/scoring";
import { formatDateTimeID } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared/states";
import {
  EXAM_CATEGORY_LABELS,
  ROLE_LABELS,
  type ExamCategory,
} from "@/types/domain";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const user = await requireAuth();

  if (user.role === "STUDENT") {
    return <StudentDashboard userId={user.id} userName={user.name} classroomId={user.classroomId} classroomName={user.classroomName} />;
  }

  return <StaffDashboard role={user.role} userId={user.id} userName={user.name} />;
}

async function StudentDashboard({
  userId,
  userName,
  classroomId,
  classroomName,
}: {
  userId: string;
  userName: string;
  classroomId: string | null;
  classroomName: string | null;
}): Promise<React.JSX.Element> {
  const now = new Date();
  const exams = classroomId
    ? await db.exam.findMany({
        where: {
          status: "PUBLISHED",
          classrooms: { some: { classroomId } },
        },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          title: true,
          category: true,
          durationMinutes: true,
          startAt: true,
          endAt: true,
          showResultToStudent: true,
          subject: { select: { name: true, code: true } },
          _count: { select: { questions: true } },
          attempts: {
            where: { studentId: userId },
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

  const activeCount = exams.filter(
    (e) => e.startAt <= now && e.endAt >= now && e.attempts[0]?.status !== "SUBMITTED"
  ).length;
  const completedCount = exams.filter(
    (e) => e.attempts[0]?.status === "SUBMITTED"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Portal Peserta · ${classroomName ?? "Belum Ada Kelas"}`}
        title={`Halo, ${userName}`}
        description="Periksa jadwal ujian aktif Anda dan siapkan token 6 karakter dari pengawas ruangan."
        actions={
          <Link href="/student/exams">
            <Button variant="outline">
              Lihat Semua Ujian
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#575652]">Ujian Tersedia</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141413]">
                {activeCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EBF4F6] text-[#0F4C5C]">
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#575652]">Telah Diselesaikan</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141413]">
                {completedCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#DCFCE7] text-[#15803D]">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#575652]">Total Jadwal Kelas</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141413]">
                {exams.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F1F1ED] text-[#575652]">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#575652]">
          Jadwal Ujian Anda
        </h2>

        {exams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada jadwal ujian aktif"
            description="Saat ini belum ada ujian yang dipublikasikan untuk kelas Anda. Periksa kembali nanti atau tanyakan ke guru mata pelajaran."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {exams.map((exam) => {
              const attempt = exam.attempts[0];
              const isOpen = exam.startAt <= now && exam.endAt >= now;
              const categoryLabel =
                EXAM_CATEGORY_LABELS[exam.category as ExamCategory] ?? exam.category;

              return (
                <Card key={exam.id} className="flex flex-col justify-between">
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="brand">{exam.subject.name}</Badge>
                          <Badge variant="neutral">{categoryLabel}</Badge>
                        </div>
                        <h3 className="text-base font-semibold text-[#141413]">
                          {exam.title}
                        </h3>
                      </div>
                      {attempt?.status === "SUBMITTED" ? (
                        <Badge variant="success">Selesai</Badge>
                      ) : attempt?.status === "LOCKED" ? (
                        <Badge variant="danger">Terkunci</Badge>
                      ) : attempt?.status === "IN_PROGRESS" ? (
                        <Badge variant="warning">Sedang Dikerjakan</Badge>
                      ) : isOpen ? (
                        <Badge variant="brand">Dibuka</Badge>
                      ) : (
                        <Badge variant="neutral">Terjadwal</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3 text-xs">
                      <div className="flex items-center gap-2 text-[#575652]">
                        <Clock className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
                        <span className="font-mono tabular-nums">
                          {exam.durationMinutes} menit
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#575652]">
                        <FileQuestion className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
                        <span className="font-mono tabular-nums">
                          {exam._count.questions} butir soal
                        </span>
                      </div>
                      <div className="col-span-2 text-[#575652]">
                        Batas akhir: <span className="font-medium text-[#141413]">{formatDateTimeID(exam.endAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {attempt?.status === "SUBMITTED" ? (
                        <>
                          <div className="text-xs text-[#575652]">
                            {exam.showResultToStudent ? (
                              <span>
                                Nilai sementara:{" "}
                                <strong className="font-mono text-sm tabular-nums text-[#141413]">
                                  {calculateScorePercent(attempt.totalScore, attempt.maxScore)}
                                </strong>
                              </span>
                            ) : (
                              <span>Nilai menunggu publikasi guru</span>
                            )}
                          </div>
                          <Link href={`/exam/${attempt.id}/result`}>
                            <Button variant="outline" size="sm">
                              Lihat Bukti
                            </Button>
                          </Link>
                        </>
                      ) : attempt?.status === "IN_PROGRESS" ? (
                        <Link href={`/exam/${attempt.id}`} className="w-full">
                          <Button className="w-full" size="sm">
                            <Play className="h-3.5 w-3.5" strokeWidth={2} />
                            Lanjutkan Pengerjaan
                          </Button>
                        </Link>
                      ) : attempt?.status === "LOCKED" ? (
                        <p className="text-xs font-medium text-[#B91C1C]">
                          Sesi terkunci karena pelanggaran. Hubungi pengawas untuk membuka kunci.
                        </p>
                      ) : isOpen ? (
                        <Link href={`/student/exams/${exam.id}/confirm`} className="w-full">
                          <Button className="w-full" size="sm">
                            <Play className="h-3.5 w-3.5" strokeWidth={2} />
                            Masuk Ruang Ujian
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled variant="secondary" size="sm" className="w-full">
                          Belum / Sudah Ditutup
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

async function StaffDashboard({
  role,
  userId,
  userName,
}: {
  role: "ADMIN" | "TEACHER";
  userId: string;
  userName: string;
}): Promise<React.JSX.Element> {
  const [studentCount, classroomCount, questionCount, examCount, activeAttempts, recentExams] =
    await Promise.all([
      db.user.count({ where: { role: "STUDENT", isActive: true } }),
      db.classroom.count(),
      db.question.count(role === "TEACHER" ? { where: { authorId: userId } } : undefined),
      db.exam.count(role === "TEACHER" ? { where: { creatorId: userId } } : undefined),
      db.examAttempt.count({ where: { status: "IN_PROGRESS" } }),
      db.exam.findMany({
        where: role === "TEACHER" ? { creatorId: userId } : undefined,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          token: true,
          status: true,
          durationMinutes: true,
          subject: { select: { name: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
    ]);

  const metrics = [
    { label: "Peserta Aktif", value: studentCount, icon: Users },
    { label: "Kelas SMP & SMA", value: classroomCount, icon: School },
    { label: "Bank Soal", value: questionCount, icon: FileQuestion },
    { label: "Sesi Berjalan", value: activeAttempts, icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${ROLE_LABELS[role]} · Ringkasan Operasional`}
        title={`Selamat bertugas, ${userName}`}
        description={`Total ${examCount} jadwal ujian tercatat. Kelola bank soal, pantau sesi langsung, dan analisis hasil asesmen siswa.`}
        actions={
          <>
            <Link href="/teacher/questions">
              <Button variant="outline">Kelola Bank Soal</Button>
            </Link>
            <Link href="/teacher/exams">
              <Button>Buat / Pantau Ujian</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#575652]">
                    {metric.label}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141413]">
                    {metric.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E5E0] bg-[#F7F7F5] text-[#0F4C5C]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#141413]">
              Jadwal Ujian Terbaru
            </h2>
            <p className="text-xs text-[#575652]">
              Akses cepat ke ruang pengawasan live dan rekap hasil penilaian.
            </p>
          </div>
          <Link href="/teacher/exams">
            <Button variant="ghost" size="sm">
              Semua Ujian
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentExams.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ClipboardList}
                title="Belum ada jadwal ujian"
                description="Mulai dengan menyusun soal di Bank Soal lalu jadwalkan ujian untuk kelas SMP atau SMA."
                action={
                  <Link href="/teacher/exams">
                    <Button size="sm">Buat Jadwal Pertama</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                  <tr>
                    <th className="px-5 py-3">Judul Ujian</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Soal / Peserta</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {recentExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-[#F7F7F5]/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#141413]">{exam.title}</p>
                        <p className="text-xs text-[#575652]">
                          {exam.subject.name} · {exam.durationMinutes} menit
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded border border-[#B8D8E0] bg-[#EBF4F6] px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-[#0F4C5C]">
                          {exam.token}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#575652]">
                        {exam._count.questions} soal · {exam._count.attempts} peserta
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            exam.status === "PUBLISHED"
                              ? "success"
                              : exam.status === "DRAFT"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/teacher/exams/${exam.id}/monitor`}>
                            <Button variant="outline" size="sm">
                              Pantau
                            </Button>
                          </Link>
                          <Link href={`/teacher/exams/${exam.id}/results`}>
                            <Button variant="secondary" size="sm">
                              Hasil
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
