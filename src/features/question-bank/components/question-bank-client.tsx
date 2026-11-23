"use client";

import { useState, useTransition } from "react";
import {
  Check,
  FileQuestion,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createQuestionAction,
  deleteQuestionAction,
  importQuestionsCsvAction,
} from "@/features/question-bank/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/shared/states";
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  type DifficultyLevel,
  type QuestionOption,
  type QuestionType,
} from "@/types/domain";

export interface QuestionListItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  authorName: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  stimulus: string | null;
  prompt: string;
  imagePath: string | null;
  options: QuestionOption[];
  acceptedAnswers: string[];
  points: number;
  competencyTag: string | null;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  level: string;
}

const DEFAULT_OPTIONS: QuestionOption[] = [
  { id: "a", label: "A", text: "", isCorrect: true },
  { id: "b", label: "B", text: "", isCorrect: false },
  { id: "c", label: "C", text: "", isCorrect: false },
  { id: "d", label: "D", text: "", isCorrect: false },
];

const CSV_TEMPLATE = `type,difficulty,points,prompt,optionA,optionB,optionC,optionD,optionE,correctKey,stimulus
SINGLE_CHOICE,MEDIUM,10,"Ibu kota Provinsi Jawa Tengah adalah ...","Bandung","Semarang","Surabaya","Yogyakarta","","B",""
SHORT_ANSWER,EASY,10,"Hasil dari 12 x 8 adalah ...","","","","","","96",""`;

export function QuestionBankClient({
  questions,
  subjects,
}: {
  questions: QuestionListItem[];
  subjects: SubjectItem[];
}): React.JSX.Element {
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [type, setType] = useState<QuestionType>("SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [points, setPoints] = useState("10");
  const [competencyTag, setCompetencyTag] = useState("");
  const [stimulus, setStimulus] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<QuestionOption[]>(DEFAULT_OPTIONS);
  const [shortAnswersText, setShortAnswersText] = useState("");

  // CSV Import state
  const [csvSubjectId, setCsvSubjectId] = useState(subjects[0]?.id ?? "");
  const [csvText, setCsvText] = useState(CSV_TEMPLATE);

  const filtered = questions.filter((q) => {
    if (filterSubject !== "ALL" && q.subjectId !== filterSubject) return false;
    if (filterType !== "ALL" && q.type !== filterType) return false;
    return true;
  });

  const handleTypeChange = (nextType: QuestionType): void => {
    setType(nextType);
    if (nextType === "TRUE_FALSE") {
      setOptions([
        { id: "true", label: "B", text: "Benar", isCorrect: true },
        { id: "false", label: "S", text: "Salah", isCorrect: false },
      ]);
    } else if (nextType === "SINGLE_CHOICE" || nextType === "MULTIPLE_CHOICE") {
      setOptions(DEFAULT_OPTIONS.map((o) => ({ ...o })));
    }
  };

  const handleAddOptionE = (): void => {
    if (options.length >= 5) return;
    setOptions([
      ...options,
      { id: "e", label: "E", text: "", isCorrect: false },
    ]);
  };

  const handleToggleOptionCorrect = (optId: string): void => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (type === "SINGLE_CHOICE" || type === "TRUE_FALSE") {
          return { ...opt, isCorrect: opt.id === optId };
        }
        return opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt;
      })
    );
  };

  const handleUploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const body: { url?: string; error?: string } = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Gagal mengunggah gambar.");
      } else {
        setImagePath(body.url);
      }
    } catch {
      setError("Koneksi gagal saat mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      subjectId,
      type,
      difficulty,
      points: Number(points),
      competencyTag,
      stimulus,
      prompt,
      imagePath: imagePath || null,
      options:
        type === "SINGLE_CHOICE" ||
        type === "MULTIPLE_CHOICE" ||
        type === "TRUE_FALSE"
          ? options
          : undefined,
      acceptedAnswers:
        type === "SHORT_ANSWER"
          ? shortAnswersText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };

    startTransition(async () => {
      const res = await createQuestionAction(payload);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCreateOpen(false);
      setPrompt("");
      setStimulus("");
      setImagePath("");
      setCompetencyTag("");
      setShortAnswersText("");
      setOptions(DEFAULT_OPTIONS.map((o) => ({ ...o })));
      setSuccess("Butir soal berhasil disimpan ke Bank Soal.");
    });
  };

  const handleImportSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await importQuestionsCsvAction({
        subjectId: csvSubjectId,
        csvText,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setImportOpen(false);
      setSuccess(`Berhasil mengimpor ${res.data.importedCount} soal dari CSV.`);
    });
  };

  const handleDelete = (id: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await deleteQuestionAction(id);
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filter & Actions Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E5E5E0] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            id="filter-subject"
            label="Filter Mata Pelajaran"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </Select>
          <Select
            id="filter-type"
            label="Filter Tipe Soal"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Semua Tipe Soal</option>
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
              <option key={t} value={t}>
                {QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" strokeWidth={2} />
            Impor CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Buat Soal Baru
          </Button>
        </div>
      </div>

      {/* Question List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="Belum ada soal pada filter ini"
          description="Buat butir soal baru atau impor massal lewat format CSV untuk mulai menyusun ujian."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Buat Soal Pertama
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="brand">{q.subjectCode}</Badge>
                    <Badge variant="neutral">{QUESTION_TYPE_LABELS[q.type]}</Badge>
                    <Badge
                      variant={
                        q.difficulty === "HARD"
                          ? "danger"
                          : q.difficulty === "MEDIUM"
                            ? "warning"
                            : "success"
                      }
                    >
                      {DIFFICULTY_LABELS[q.difficulty]}
                    </Badge>
                    <span className="font-mono text-xs text-[#575652]">
                      {q.points} poin
                    </span>
                    {q.competencyTag && (
                      <span className="text-xs text-[#575652]">
                        · {q.competencyTag}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(q.id)}
                    aria-label="Hapus soal"
                  >
                    <Trash2 className="h-4 w-4 text-[#B91C1C]" strokeWidth={1.75} />
                  </Button>
                </div>

                {q.stimulus && (
                  <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3 text-xs leading-relaxed text-[#575652] whitespace-pre-line">
                    <p className="mb-1 font-mono text-[11px] font-semibold uppercase text-[#0F4C5C]">
                      Wacana / Stimulus
                    </p>
                    {q.stimulus}
                  </div>
                )}

                <p className="text-sm font-medium leading-relaxed text-[#141413]">
                  {q.prompt}
                </p>

                {q.options.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                          opt.isCorrect
                            ? "border-[#15803D] bg-[#DCFCE7] text-[#14532D] font-medium"
                            : "border-[#E5E5E0] bg-white text-[#575652]"
                        }`}
                      >
                        <span className="font-mono font-semibold">
                          {opt.label}.
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.isCorrect && (
                          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "SHORT_ANSWER" && q.acceptedAnswers.length > 0 && (
                  <p className="text-xs text-[#14532D]">
                    Kunci diterima:{" "}
                    <span className="font-mono font-semibold">
                      {q.acceptedAnswers.join(" | ")}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Question */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Butir Soal Baru"
        description="Mendukung format AKM/Kurikulum Merdeka (4 opsi untuk SMP atau 5 opsi untuk SMA)."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="q-subject"
              label="Mata Pelajaran"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
            <Select
              id="q-type"
              label="Tipe Soal"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
            <Select
              id="q-diff"
              label="Tingkat Kesukaran"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as DifficultyLevel)
              }
            >
              <option value="EASY">Mudah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HARD">Sukar</option>
            </Select>
            <Input
              id="q-points"
              label="Bobot Poin"
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
          </div>

          <Input
            id="q-tag"
            label="Indikator / Kompetensi (Opsional)"
            placeholder="Contoh: Literasi Informasi — Gagasan Utama"
            value={competencyTag}
            onChange={(e) => setCompetencyTag(e.target.value)}
          />

          <Textarea
            id="q-stimulus"
            label="Wacana / Stimulus Bacaan (Opsional — aktifkan mode split-pane)"
            placeholder="Tempelkan teks bacaan, kasus, atau informasi pendukung di sini..."
            value={stimulus}
            onChange={(e) => setStimulus(e.target.value)}
          />

          <Textarea
            id="q-prompt"
            label="Pertanyaan Soal"
            placeholder="Tuliskan pokok pertanyaan yang jelas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label
              htmlFor="q-image"
              className="block text-sm font-medium text-[#141413]"
            >
              Lampiran Gambar Soal (Opsional, PNG/JPG/WEBP maks 2MB)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[#D4D4CC] bg-white px-3 text-xs font-medium text-[#141413] hover:bg-[#F7F7F5]">
                <ImagePlus className="h-4 w-4 text-[#0F4C5C]" strokeWidth={1.75} />
                <span>{uploading ? "Mengunggah..." : "Pilih Gambar"}</span>
                <input
                  id="q-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadImage}
                  className="sr-only"
                />
              </label>
              {imagePath && (
                <span className="font-mono text-xs text-[#15803D]">
                  Terunggah: {imagePath}
                </span>
              )}
            </div>
          </div>

          {(type === "SINGLE_CHOICE" ||
            type === "MULTIPLE_CHOICE" ||
            type === "TRUE_FALSE") && (
            <div className="space-y-2.5 rounded-lg border border-[#E5E5E0] bg-[#F7F7F5] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#575652]">
                  Opsi Jawaban ({type === "MULTIPLE_CHOICE" ? "Boleh >1 kunci benar" : "Pilih 1 kunci benar"})
                </p>
                {(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") &&
                  options.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOptionE}
                    >
                      + Tambah Opsi E (SMA)
                    </Button>
                  )}
              </div>
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleOptionCorrect(opt.id)}
                    aria-label={`Tandai opsi ${opt.label} sebagai jawaban benar`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      opt.isCorrect
                        ? "border-[#15803D] bg-[#15803D] text-white"
                        : "border-[#D4D4CC] bg-white text-[#575652] hover:border-[#0F4C5C]"
                    }`}
                  >
                    {opt.label}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    disabled={type === "TRUE_FALSE"}
                    placeholder={`Teks pilihan ${opt.label}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOptions((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, text: val } : item
                        )
                      );
                    }}
                    className="h-9 flex-1 rounded-md border border-[#D4D4CC] bg-white px-3 text-sm text-[#141413] focus:border-[#0F4C5C] focus:outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {type === "SHORT_ANSWER" && (
            <Input
              id="q-short-answers"
              label="Kata Kunci Jawaban Benar (pisahkan dengan koma jika ada sinonim)"
              placeholder="Contoh: tesis, pernyataan pendapat"
              value={shortAnswersText}
              onChange={(e) => setShortAnswersText(e.target.value)}
              required
            />
          )}

          <div className="flex justify-end gap-2 border-t border-[#E5E5E0] pt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              Simpan Butir Soal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: CSV Bulk Import */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Impor Soal Massal via CSV"
        description="Tempelkan baris CSV sesuai kolom header untuk menambahkan banyak soal sekaligus."
        size="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <Select
            id="csv-subject"
            label="Mata Pelajaran Tujuan"
            value={csvSubjectId}
            onChange={(e) => setCsvSubjectId(e.target.value)}
            required
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </Select>

          <Textarea
            id="csv-body"
            label="Data CSV"
            rows={8}
            className="font-mono text-xs"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            hint="Gunakan pemisah | untuk banyak kunci pada MULTIPLE_CHOICE atau SHORT_ANSWER (misal: A|C)."
            required
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Upload className="h-4 w-4" strokeWidth={2} />
              Proses Impor CSV
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
