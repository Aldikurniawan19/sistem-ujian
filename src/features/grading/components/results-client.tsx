"use client";

import { useState, useTransition } from "react";
import {
  BarChart3,
  Check,
  Download,
  FileText,
  GraduationCap,
} from "lucide-react";
import { gradeEssayAnswerAction } from "@/features/grading/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { calculateScorePercent } from "@/lib/scoring";
import { formatDateTimeID } from "@/lib/utils";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/types/domain";

export interface ResultRow {
  attemptId: string;
  studentName: string;
  username: string;
  classroomName: string;
  status: string;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  violationCount: number;
  submittedAt: string | null;
}

export interface EssayGradingItem {
  attemptAnswerId: string;
  studentName: string;
  username: string;
  classroomName: string;
  questionPrompt: string;
  maxPoints: number;
  studentResponse: string;
  earnedPoints: number | null;
  teacherFeedback: string | null;
}

export interface ItemAnalysisRow {
  questionId: string;
  orderNumber: number;
  prompt: string;
  type: QuestionType;
  totalResponses: number;
  correctCount: number;
  correctRate: number;
}

export function ResultsClient({
  examId,
  results,
  essays,
  itemAnalysis,
}: {
  examId: string;
  results: ResultRow[];
  essays: EssayGradingItem[];
  itemAnalysis: ItemAnalysisRow[];
}): React.JSX.Element {
  const [tab, setTab] = useState<"scores" | "essays" | "analysis">("scores");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const e of essays) {
      initial[e.attemptAnswerId] =
        e.earnedPoints !== null ? String(e.earnedPoints) : "";
    }
    return initial;
  });
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const e of essays) {
        initial[e.attemptAnswerId] = e.teacherFeedback ?? "";
      }
      return initial;
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const avgPercent =
    results.length > 0
      ? Math.round(
          (results.reduce(
            (sum, r) => sum + calculateScorePercent(r.totalScore, r.maxScore),
            0
          ) /
            results.length) *
            10
        ) / 10
      : 0;

  const handleSaveEssay = (item: EssayGradingItem): void => {
    setError(null);
    setSavedId(null);
    const score = Number(scoreDrafts[item.attemptAnswerId] ?? "0");
    const feedback = feedbackDrafts[item.attemptAnswerId] ?? "";

    startTransition(async () => {
      const res = await gradeEssayAnswerAction({
        attemptAnswerId: item.attemptAnswerId,
        earnedPoints: score,
        teacherFeedback: feedback,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSavedId(item.attemptAnswerId);
    });
  };

  return (
    <div className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary & Tab Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={tab === "scores" ? "primary" : "outline"}
            onClick={() => setTab("scores")}
          >
            <GraduationCap className="h-4 w-4" strokeWidth={2} />
            Rekap Nilai ({results.length})
          </Button>
          <Button
            size="sm"
            variant={tab === "essays" ? "primary" : "outline"}
            onClick={() => setTab("essays")}
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
            Koreksi Esai ({essays.length})
          </Button>
          <Button
            size="sm"
            variant={tab === "analysis" ? "primary" : "outline"}
            onClick={() => setTab("analysis")}
          >
            <BarChart3 className="h-4 w-4" strokeWidth={2} />
            Analisis Butir ({itemAnalysis.length})
          </Button>
        </div>

        <a href={`/api/exams/${examId}/export`}>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" strokeWidth={2} />
            Ekspor CSV (Excel)
          </Button>
        </a>
      </div>

      {/* Tab 1: Score Table */}
      {tab === "scores" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#575652]">Rata-rata Kelas</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#0F4C5C]">
                  {avgPercent}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#575652]">Peserta Mengumpulkan</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#141413]">
                  {results.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#575652]">Esai Belum Dinilai</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#D97706]">
                  {essays.filter((e) => e.earnedPoints === null).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Belum ada peserta yang mengumpulkan ujian"
              description="Nilai otomatis akan langsung tampil di tabel ini segera setelah siswa menyelesaikan sesi."
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                    <tr>
                      <th className="px-5 py-3">Peserta</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Objektif</th>
                      <th className="px-4 py-3">Esai</th>
                      <th className="px-4 py-3">Nilai (0–100)</th>
                      <th className="px-5 py-3">Dikumpulkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E0]">
                    {results.map((r) => {
                      const pct = calculateScorePercent(r.totalScore, r.maxScore);
                      return (
                        <tr key={r.attemptId} className="hover:bg-[#F7F7F5]/60">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[#141413]">
                              {r.studentName}
                            </p>
                            <p className="font-mono text-xs text-[#575652]">
                              {r.username}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-[#575652]">
                            {r.classroomName}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#141413]">
                            {r.autoScore}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#141413]">
                            {r.manualScore}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                pct >= 75
                                  ? "success"
                                  : pct >= 55
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              <span className="font-mono tabular-nums">
                                {pct}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-[#575652]">
                            {r.submittedAt ? formatDateTimeID(r.submittedAt) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Manual Essay Grading */}
      {tab === "essays" && (
        <div className="space-y-4">
          {essays.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak ada jawaban esai untuk dikoreksi"
              description="Ujian ini tidak memiliki soal uraian atau belum ada siswa yang mengumpulkan jawaban."
            />
          ) : (
            essays.map((item) => (
              <Card key={item.attemptAnswerId}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#141413]">
                      {item.studentName}{" "}
                      <span className="font-mono text-xs font-normal text-[#575652]">
                        ({item.username} · {item.classroomName})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-[#575652]">
                      {item.questionPrompt}
                    </p>
                  </div>
                  <Badge variant="brand">Maks {item.maxPoints} poin</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-4 text-sm leading-relaxed text-[#141413] whitespace-pre-line">
                    {item.studentResponse || "(Peserta tidak mengisi jawaban)"}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                    <div className="sm:col-span-3">
                      <label
                        htmlFor={`score-${item.attemptAnswerId}`}
                        className="mb-1 block text-xs font-medium text-[#141413]"
                      >
                        Skor (0–{item.maxPoints})
                      </label>
                      <input
                        id={`score-${item.attemptAnswerId}`}
                        type="number"
                        min={0}
                        max={item.maxPoints}
                        step="0.5"
                        value={scoreDrafts[item.attemptAnswerId] ?? ""}
                        onChange={(e) =>
                          setScoreDrafts((prev) => ({
                            ...prev,
                            [item.attemptAnswerId]: e.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-[#D4D4CC] bg-white px-3 font-mono text-sm text-[#141413] focus:border-[#0F4C5C] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label
                        htmlFor={`fb-${item.attemptAnswerId}`}
                        className="mb-1 block text-xs font-medium text-[#141413]"
                      >
                        Catatan Guru (Opsional)
                      </label>
                      <input
                        id={`fb-${item.attemptAnswerId}`}
                        type="text"
                        placeholder="Umpan balik singkat untuk siswa"
                        value={feedbackDrafts[item.attemptAnswerId] ?? ""}
                        onChange={(e) =>
                          setFeedbackDrafts((prev) => ({
                            ...prev,
                            [item.attemptAnswerId]: e.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-[#D4D4CC] bg-white px-3 text-sm text-[#141413] focus:border-[#0F4C5C] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Button
                        className="w-full"
                        disabled={isPending}
                        onClick={() => handleSaveEssay(item)}
                      >
                        {savedId === item.attemptAnswerId ? (
                          <>
                            <Check className="h-4 w-4" strokeWidth={2} />
                            Tersimpan
                          </>
                        ) : (
                          "Simpan Nilai"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Item Analysis */}
      {tab === "analysis" && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[#141413]">
              Analisis Tingkat Kesukaran Empiris per Butir Soal
            </h2>
            <p className="text-xs text-[#575652]">
              Indeks kesukaran dihitung dari persentase peserta yang menjawab benar pada tiap butir soal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {itemAnalysis.map((item) => {
              const empiricalLabel =
                item.totalResponses === 0
                  ? "Belum Ada Data"
                  : item.correctRate >= 70
                    ? "Mudah"
                    : item.correctRate >= 35
                      ? "Sedang (Ideal)"
                      : "Sukar";

              const barColor =
                item.correctRate >= 70
                  ? "bg-[#15803D]"
                  : item.correctRate >= 35
                    ? "bg-[#0F4C5C]"
                    : "bg-[#B91C1C]";

              return (
                <div
                  key={item.questionId}
                  className="space-y-2 rounded-md border border-[#E5E5E0] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#0F4C5C]">
                        #{item.orderNumber}
                      </span>
                      <Badge variant="neutral">
                        {QUESTION_TYPE_LABELS[item.type]}
                      </Badge>
                      <Badge
                        variant={
                          empiricalLabel === "Sukar"
                            ? "danger"
                            : empiricalLabel === "Mudah"
                              ? "success"
                              : "brand"
                        }
                      >
                        {empiricalLabel}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#141413]">
                      {item.correctRate}% benar ({item.correctCount}/
                      {item.totalResponses})
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-[#141413]">
                    {item.prompt}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E5E0]">
                    <div
                      className={`h-full ${barColor}`}
                      style={{ width: `${item.correctRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
