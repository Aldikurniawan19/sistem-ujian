import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateScorePercent } from "@/lib/scoring";
import { formatDateTimeID } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ExamResultPage({
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
      startedAt: true,
      submittedAt: true,
      autoScore: true,
      manualScore: true,
      totalScore: true,
      maxScore: true,
      exam: {
        select: {
          title: true,
          showResultToStudent: true,
          subject: { select: { name: true } },
          questions: {
            select: { question: { select: { type: true } } },
          },
        },
      },
      answers: {
        select: { answerJson: true, isCorrect: true },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  const hasEssay = attempt.exam.questions.some(
    (q) => q.question.type === "ESSAY"
  );
  const percent = calculateScorePercent(attempt.totalScore, attempt.maxScore);
  const answeredTotal = attempt.answers.filter(
    (a) => a.answerJson !== null && a.answerJson !== '""' && a.answerJson !== "[]"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D]">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <Badge variant="success" className="mt-4">
                Bukti Pengumpulan Ujian
              </Badge>
              <h1 className="mt-2 text-xl font-semibold text-[#141413]">
                {attempt.exam.title}
              </h1>
              <p className="mt-1 text-sm text-[#575652]">
                {attempt.exam.subject.name} · {student.name} ({student.username})
              </p>
            </div>

            {attempt.exam.showResultToStudent ? (
              <div className="rounded-lg border border-[#B8D8E0] bg-[#EBF4F6] p-5 text-center">
                <p className="font-mono text-xs uppercase tracking-wider text-[#0F4C5C]">
                  {hasEssay ? "Nilai Sementara (Menunggu Koreksi Esai)" : "Nilai Akhir"}
                </p>
                <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-[#0F4C5C]">
                  {percent}
                </p>
                <p className="mt-1 font-mono text-xs tabular-nums text-[#575652]">
                  Perolehan poin: {attempt.totalScore} / {attempt.maxScore}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[#E5E5E0] bg-[#F7F7F5] p-4 text-center text-sm text-[#575652]">
                Jawaban Anda telah tersimpan dengan aman. Hasil nilai akan diumumkan oleh guru mata pelajaran.
              </div>
            )}

            <dl className="divide-y divide-[#E5E5E0] rounded-md border border-[#E5E5E0] text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-[#575652]">Soal Dijawab</dt>
                <dd className="font-mono font-semibold tabular-nums text-[#141413]">
                  {answeredTotal} / {attempt.exam.questions.length}
                </dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="text-[#575652]">Waktu Mulai</dt>
                <dd className="font-mono text-xs text-[#141413]">
                  {formatDateTimeID(attempt.startedAt)}
                </dd>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <dt className="flex items-center gap-1.5 text-[#575652]">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Waktu Dikumpulkan</span>
                </dt>
                <dd className="font-mono text-xs text-[#141413]">
                  {attempt.submittedAt ? formatDateTimeID(attempt.submittedAt) : "-"}
                </dd>
              </div>
            </dl>

            <div className="flex justify-center pt-2">
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
