import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/states";
import { TokenConfirmClient } from "@/features/exam-session/components/token-confirm-client";
import { EXAM_CATEGORY_LABELS, type ExamCategory } from "@/types/domain";

export default async function ExamConfirmPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}): Promise<React.JSX.Element> {
  const student = await requireRole(["STUDENT"]);
  const { examId } = await params;

  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      durationMinutes: true,
      maxViolations: true,
      status: true,
      subject: { select: { name: true } },
      classrooms: { select: { classroomId: true } },
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId: student.id },
        select: { id: true, status: true },
      },
    },
  });

  if (!exam || exam.status !== "PUBLISHED") {
    notFound();
  }

  const eligible =
    student.classroomId !== null &&
    exam.classrooms.some((c) => c.classroomId === student.classroomId);
  if (!eligible) {
    redirect("/student/exams");
  }

  const existing = exam.attempts[0];
  if (existing?.status === "IN_PROGRESS") {
    redirect(`/exam/${existing.id}`);
  }
  if (existing?.status === "SUBMITTED") {
    redirect(`/exam/${existing.id}/result`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gerbang Konfirmasi Ujian"
        title={exam.title}
        description="Periksa identitas peserta dan aturan pengerjaan, lalu masukkan token 6 karakter dari pengawas."
        actions={
          <Link href="/student/exams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Kembali
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Exam Briefing & Rules */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{exam.subject.name}</Badge>
              <Badge variant="neutral">
                {EXAM_CATEGORY_LABELS[exam.category as ExamCategory] ?? exam.category}
              </Badge>
            </div>
            <h2 className="mt-2 text-base font-semibold text-[#141413]">
              Ringkasan &amp; Tata Tertib Sesi
            </h2>
          </CardHeader>
          <CardContent className="space-y-5">
            {exam.description && (
              <p className="text-sm leading-relaxed text-[#575652]">
                {exam.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3.5">
                <div className="flex items-center gap-2 text-xs text-[#575652]">
                  <Clock className="h-4 w-4 text-[#0F4C5C]" strokeWidth={2} />
                  <span>Durasi Pengerjaan</span>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#141413]">
                  {exam.durationMinutes} Menit
                </p>
              </div>
              <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3.5">
                <div className="flex items-center gap-2 text-xs text-[#575652]">
                  <FileQuestion className="h-4 w-4 text-[#0F4C5C]" strokeWidth={2} />
                  <span>Jumlah Butir</span>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#141413]">
                  {exam._count.questions} Soal
                </p>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-[#E5E5E0] pt-4 text-sm text-[#575652]">
              <p className="flex items-center gap-2 font-semibold text-[#141413]">
                <ShieldCheck className="h-4 w-4 text-[#0F4C5C]" strokeWidth={2} />
                <span>Ketentuan Integritas &amp; Auto-Save</span>
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed">
                <li>
                  Waktu mulai berjalan di server segera setelah token diverifikasi dan akan mengumpulkan jawaban otomatis saat mencapai <span className="font-mono">00:00</span>.
                </li>
                <li>
                  Setiap pilihan jawaban tersimpan otomatis. Anda dapat menandai soal <strong>Ragu-ragu</strong> atau mencoret pengecoh pada pilihan ganda.
                </li>
                <li>
                  Perpindahan tab atau meminimalkan jendela browser tercatat oleh sistem pengawas. Batas maksimal pelanggaran: <strong className="font-mono">{exam.maxViolations} kali</strong> sebelum sesi terkunci otomatis.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Right: Participant Identity + 6-Box OTP Token */}
        <Card className="lg:col-span-5 lg:self-start">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
              <UserCheck className="h-4 w-4 text-[#0F4C5C]" strokeWidth={2} />
              <span>Identitas Peserta</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="divide-y divide-[#E5E5E0] rounded-md border border-[#E5E5E0] bg-[#F7F7F5] text-sm">
              <div className="flex justify-between px-3.5 py-2.5">
                <dt className="text-[#575652]">Nama</dt>
                <dd className="font-semibold text-[#141413]">{student.name}</dd>
              </div>
              <div className="flex justify-between px-3.5 py-2.5">
                <dt className="text-[#575652]">NISN</dt>
                <dd className="font-mono text-[#141413]">{student.username}</dd>
              </div>
              <div className="flex justify-between px-3.5 py-2.5">
                <dt className="text-[#575652]">Kelas</dt>
                <dd className="font-mono font-semibold text-[#0F4C5C]">
                  {student.classroomLevel} · {student.classroomName}
                </dd>
              </div>
            </dl>

            <TokenConfirmClient examId={exam.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
