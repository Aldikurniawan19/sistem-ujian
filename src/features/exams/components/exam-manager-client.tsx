"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Check,
  ClipboardList,
  Copy,
  Maximize2,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  createExamAction,
  rotateExamTokenAction,
  updateExamStatusAction,
} from "@/features/exams/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/shared/states";
import { formatDateTimeID } from "@/lib/utils";
import {
  EXAM_CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
  type ExamCategory,
  type ExamStatus,
  type QuestionType,
} from "@/types/domain";

export interface ExamListItem {
  id: string;
  title: string;
  category: ExamCategory;
  subjectName: string;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  token: string;
  status: ExamStatus;
  classrooms: string[];
  questionCount: number;
  attemptCount: number;
}

export interface ExamFormOptionData {
  subjects: { id: string; code: string; name: string }[];
  classrooms: { id: string; name: string; level: string }[];
  questions: {
    id: string;
    subjectId: string;
    prompt: string;
    type: QuestionType;
    points: number;
  }[];
}

function defaultDateTimeLocal(offsetHours: number): string {
  const date = new Date(Date.now() + offsetHours * 3600 * 1000);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ExamManagerClient({
  exams,
  options,
}: {
  exams: ExamListItem[];
  options: ExamFormOptionData;
}): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);
  const [projectorExam, setProjectorExam] = useState<ExamListItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExamCategory>("PTS");
  const [subjectId, setSubjectId] = useState(options.subjects[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [startAt, setStartAt] = useState(() => defaultDateTimeLocal(0));
  const [endAt, setEndAt] = useState(() => defaultDateTimeLocal(24 * 7));
  const [maxViolations, setMaxViolations] = useState("3");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showResultToStudent, setShowResultToStudent] = useState(true);
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const subjectQuestions = options.questions.filter(
    (q) => q.subjectId === subjectId
  );

  const toggleItem = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ): void => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyToken = async (examId: string, token: string): Promise<void> => {
    await navigator.clipboard.writeText(token);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRotateToken = (examId: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await rotateExamTokenAction(examId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      if (projectorExam && projectorExam.id === examId) {
        setProjectorExam({ ...projectorExam, token: res.data.token });
      }
      setSuccess(`Token ujian diperbarui menjadi ${res.data.token}.`);
    });
  };

  const handleStatusChange = (examId: string, status: ExamStatus): void => {
    setError(null);
    startTransition(async () => {
      const res = await updateExamStatusAction({ examId, status });
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  const handleCreate = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createExamAction({
        title,
        description,
        category,
        subjectId,
        durationMinutes: Number(durationMinutes),
        startAt,
        endAt,
        maxViolations: Number(maxViolations),
        shuffleQuestions,
        shuffleOptions,
        showResultToStudent,
        classroomIds: selectedClassrooms,
        questionIds: selectedQuestions,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setSelectedClassrooms([]);
      setSelectedQuestions([]);
      setSuccess(`Jadwal ujian dibuat dengan token aktif: ${res.data.token}`);
    });
  };

  return (
    <div className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Buat Jadwal Ujian
        </Button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada jadwal ujian"
          description="Buat jadwal ujian baru, pilih kelas SMP/SMA target, dan bagikan token 6 karakter ke peserta."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Buat Jadwal Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="brand">{exam.subjectName}</Badge>
                      <Badge variant="neutral">
                        {EXAM_CATEGORY_LABELS[exam.category]}
                      </Badge>
                    </div>
                    <h2 className="text-base font-semibold text-[#141413]">
                      {exam.title}
                    </h2>
                    <p className="text-xs text-[#575652]">
                      Kelas: {exam.classrooms.join(", ") || "—"} ·{" "}
                      <span className="font-mono tabular-nums">
                        {exam.durationMinutes} mnt · {exam.questionCount} soal ·{" "}
                        {exam.attemptCount} peserta
                      </span>
                    </p>
                  </div>
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
                </div>

                {/* Live Token Strip with Projector Mode */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#B8D8E0] bg-[#EBF4F6] px-4 py-3">
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#0F4C5C]">
                      Token Sesi Aktif
                    </p>
                    <p className="font-mono text-xl font-bold tracking-[0.22em] text-[#0F4C5C]">
                      {exam.token}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToken(exam.id, exam.token)}
                      aria-label="Salin token"
                    >
                      {copiedId === exam.id ? (
                        <Check className="h-3.5 w-3.5 text-[#15803D]" strokeWidth={2} />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRotateToken(exam.id)}
                      aria-label="Ganti token baru"
                    >
                      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setProjectorExam(exam)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Proyektor
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-[#575652]">
                  Jadwal: {formatDateTimeID(exam.startAt)} —{" "}
                  {formatDateTimeID(exam.endAt)}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E0] pt-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/exams/${exam.id}/monitor`}>
                      <Button variant="outline" size="sm">
                        <Activity className="h-3.5 w-3.5" strokeWidth={2} />
                        Monitoring Live
                      </Button>
                    </Link>
                    <Link href={`/teacher/exams/${exam.id}/results`}>
                      <Button variant="secondary" size="sm">
                        <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                        Hasil &amp; Analisis
                      </Button>
                    </Link>
                  </div>

                  {exam.status === "PUBLISHED" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleStatusChange(exam.id, "ARCHIVED")}
                    >
                      Arsipkan
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleStatusChange(exam.id, "PUBLISHED")}
                    >
                      Publikasikan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Projector Token Mode */}
      <Modal
        open={projectorExam !== null}
        onClose={() => setProjectorExam(null)}
        title="Mode Proyektor — Token Ujian"
        description={projectorExam?.title}
        size="lg"
      >
        {projectorExam && (
          <div className="space-y-6 py-4 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#575652]">
              Masukkan 6 karakter berikut pada gerbang konfirmasi ujian
            </p>
            <div className="mx-auto flex justify-center gap-2 sm:gap-3">
              {projectorExam.token.split("").map((char, idx) => (
                <span
                  key={`${char}-${idx}`}
                  className="flex h-16 w-12 items-center justify-center rounded-lg border-2 border-[#0F4C5C] bg-[#EBF4F6] font-mono text-3xl font-bold text-[#0F4C5C] sm:h-24 sm:w-20 sm:text-5xl"
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() =>
                  handleCopyToken(projectorExam.id, projectorExam.token)
                }
              >
                <Copy className="h-4 w-4" strokeWidth={2} />
                Salin Token
              </Button>
              <Button
                variant="secondary"
                disabled={isPending}
                onClick={() => handleRotateToken(projectorExam.id)}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2} />
                Putar Token Baru
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Exam */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Jadwal Ujian Baru"
        description="Pilih mata pelajaran, kelas target SMP/SMA, dan butir soal yang akan diujikan."
        size="xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="exam-title"
              label="Judul Ujian"
              placeholder="Contoh: Sumatif Akhir Semester — Fisika X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Select
              id="exam-category"
              label="Kategori Asesmen"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExamCategory)}
            >
              {(Object.keys(EXAM_CATEGORY_LABELS) as ExamCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {EXAM_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </Select>
            <Select
              id="exam-subject"
              label="Mata Pelajaran"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setSelectedQuestions([]);
              }}
              required
            >
              {options.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="exam-duration"
                label="Durasi (menit)"
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
              <Input
                id="exam-max-violations"
                label="Batas Pelanggaran"
                type="number"
                min={1}
                max={20}
                value={maxViolations}
                onChange={(e) => setMaxViolations(e.target.value)}
                required
              />
            </div>
            <Input
              id="exam-start"
              label="Dibuka Mulai"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
            <Input
              id="exam-end"
              label="Ditutup Pada"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>

          <Textarea
            id="exam-desc"
            label="Petunjuk Singkat (Opsional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex flex-wrap gap-5 rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="h-4 w-4 accent-[#0F4C5C]"
              />
              <span>Acak urutan soal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="h-4 w-4 accent-[#0F4C5C]"
              />
              <span>Acak opsi jawaban</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showResultToStudent}
                onChange={(e) => setShowResultToStudent(e.target.checked)}
                className="h-4 w-4 accent-[#0F4C5C]"
              />
              <span>Tampilkan nilai ke siswa</span>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[#141413]">
              Target Kelas Peserta ({selectedClassrooms.length} dipilih)
            </p>
            <div className="flex flex-wrap gap-2">
              {options.classrooms.map((c) => {
                const active = selectedClassrooms.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleItem(c.id, setSelectedClassrooms)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "border-[#0F4C5C] bg-[#0F4C5C] text-white"
                        : "border-[#D4D4CC] bg-white text-[#141413] hover:bg-[#F7F7F5]"
                    }`}
                  >
                    {c.level} · {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#141413]">
                Pilih Butir Soal ({selectedQuestions.length} / {subjectQuestions.length})
              </p>
              {subjectQuestions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedQuestions(subjectQuestions.map((q) => q.id))
                  }
                >
                  Pilih Semua
                </Button>
              )}
            </div>
            {subjectQuestions.length === 0 ? (
              <Alert variant="warning">
                Belum ada soal untuk mata pelajaran ini. Tambahkan soal terlebih dahulu di menu Bank Soal.
              </Alert>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3">
                {subjectQuestions.map((q) => {
                  const checked = selectedQuestions.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-2.5 text-xs transition-colors ${
                        checked
                          ? "border-[#0F4C5C] bg-[#EBF4F6]"
                          : "border-[#E5E5E0] bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(q.id, setSelectedQuestions)}
                        className="mt-0.5 h-4 w-4 accent-[#0F4C5C]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium text-[#141413]">
                          {q.prompt}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#575652]">
                          {QUESTION_TYPE_LABELS[q.type]} · {q.points} poin
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E5E5E0] pt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              Publikasikan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
