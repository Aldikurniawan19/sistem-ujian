"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Flag,
  LayoutGrid,
  Loader2,
  Lock,
  Maximize,
  Minimize,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  logViolationAction,
  saveAnswerAction,
  submitExamAction,
} from "@/features/exam-session/actions";
import { ExamTimer } from "@/features/exam-session/components/exam-timer";
import {
  QuestionBody,
  type FontScale,
} from "@/features/exam-session/components/question-body";
import {
  QuestionNavigator,
  type PaletteItem,
} from "@/features/exam-session/components/question-navigator";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/skeleton";
import type { StudentAnswerValue, StudentExamQuestion } from "@/types/domain";

export interface InitialAnswerState {
  answer: StudentAnswerValue;
  isFlagged: boolean;
}

export interface ExamWorkspaceProps {
  attemptId: string;
  examTitle: string;
  subjectName: string;
  studentName: string;
  studentUsername: string;
  initialRemainingSeconds: number;
  initialViolationCount: number;
  maxViolations: number;
  questions: readonly StudentExamQuestion[];
  initialAnswers: Record<string, InitialAnswerState>;
}

function hasAnswerValue(value: StudentAnswerValue): boolean {
  if (value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return value.length > 0;
}

export function ExamWorkspace({
  attemptId,
  examTitle,
  subjectName,
  studentName,
  studentUsername,
  initialRemainingSeconds,
  initialViolationCount,
  maxViolations,
  questions,
  initialAnswers,
}: ExamWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, InitialAnswerState>>(initialAnswers);
  const [eliminated, setEliminated] = useState<Record<string, string[]>>({});
  const [fontScale, setFontScale] = useState<FontScale>("md");
  const [splitPane, setSplitPane] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anti-cheat state
  const [violationCount, setViolationCount] = useState(initialViolationCount);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const lastViolationTsRef = useRef<number>(0);

  const currentQuestion = questions[currentIndex];
  const currentEntry: InitialAnswerState = currentQuestion
    ? (answers[currentQuestion.id] ?? { answer: null, isFlagged: false })
    : { answer: null, isFlagged: false };

  const paletteItems: PaletteItem[] = useMemo(
    () =>
      questions.map((q) => {
        const entry = answers[q.id];
        return {
          questionId: q.id,
          orderNumber: q.orderNumber,
          isAnswered: hasAnswerValue(entry?.answer ?? null),
          isFlagged: entry?.isFlagged ?? false,
        };
      }),
    [questions, answers]
  );

  const answeredCount = paletteItems.filter((p) => p.isAnswered).length;
  const flaggedCount = paletteItems.filter((p) => p.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const persistAnswer = useCallback(
    async (questionId: string, nextAnswer: StudentAnswerValue, nextFlagged: boolean) => {
      setSaveState("saving");
      try {
        const res = await saveAnswerAction({
          attemptId,
          questionId,
          answer: nextAnswer,
          isFlagged: nextFlagged,
        });
        if (!res.success) {
          setSaveState("error");
          return;
        }
        if (res.data.expired) {
          router.replace(`/exam/${attemptId}/result`);
          return;
        }
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [attemptId, router]
  );

  const handleAnswerChange = useCallback(
    (nextValue: StudentAnswerValue) => {
      if (!currentQuestion) return;
      const qId = currentQuestion.id;
      const currentFlag = answers[qId]?.isFlagged ?? false;

      setAnswers((prev) => ({
        ...prev,
        [qId]: { answer: nextValue, isFlagged: currentFlag },
      }));

      // Debounce text inputs; immediate save for choices
      const isTextType =
        currentQuestion.type === "SHORT_ANSWER" ||
        currentQuestion.type === "ESSAY";

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      if (isTextType) {
        setSaveState("saving");
        debounceTimerRef.current = window.setTimeout(() => {
          void persistAnswer(qId, nextValue, currentFlag);
        }, 500);
      } else {
        void persistAnswer(qId, nextValue, currentFlag);
      }
    },
    [answers, currentQuestion, persistAnswer]
  );

  const handleToggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const current = answers[qId] ?? { answer: null, isFlagged: false };
    const nextFlagged = !current.isFlagged;

    setAnswers((prev) => ({
      ...prev,
      [qId]: { answer: current.answer, isFlagged: nextFlagged },
    }));

    void persistAnswer(qId, current.answer, nextFlagged);
  }, [answers, currentQuestion, persistAnswer]);

  const handleClearAnswer = (): void => {
    if (!currentQuestion) return;
    handleAnswerChange(null);
  };

  const handleToggleEliminate = (optionId: string): void => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setEliminated((prev) => {
      const list = prev[qId] ?? [];
      const next = list.includes(optionId)
        ? list.filter((id) => id !== optionId)
        : [...list, optionId];
      return { ...prev, [qId]: next };
    });
  };

  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const res = await submitExamAction({ attemptId });
    if (res.success) {
      router.replace(`/exam/${attemptId}/result`);
    } else {
      setIsSubmitting(false);
      setToastNotice(res.error);
    }
  }, [attemptId, isSubmitting, router]);

  const showPoliteToast = useCallback((message: string) => {
    setToastNotice(message);
    window.setTimeout(() => {
      setToastNotice((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  const recordViolation = useCallback(
    async (type: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT", detail: string) => {
      if (isLocked || isSubmitting) return;
      const now = Date.now();
      // Cooldown 2.5s so blur + visibilitychange don't double-count
      if (now - lastViolationTsRef.current < 2500) return;
      lastViolationTsRef.current = now;

      const res = await logViolationAction({ attemptId, type, detail });
      if (!res.success) return;

      setViolationCount(res.data.violationCount);
      if (res.data.locked) {
        setIsLocked(true);
      } else {
        setWarningMessage(
          `Terdeteksi meninggalkan layar ujian (${res.data.violationCount}/${res.data.maxViolations}). Harap tetap berada di halaman ini agar sesi tidak terkunci otomatis.`
        );
      }
    },
    [attemptId, isLocked, isSubmitting]
  );

  // Anti-cheat listeners (transparent & polite)
  useEffect(() => {
    const onVisibilityChange = (): void => {
      if (document.hidden) {
        void recordViolation("TAB_SWITCH", "Peserta berpindah tab atau meminimalkan browser");
      }
    };

    const onContextMenu = (e: MouseEvent): void => {
      e.preventDefault();
      showPoliteToast("Klik kanan dinonaktifkan selama sesi ujian berlangsung.");
    };

    const onCopyOrPaste = (e: ClipboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) {
        return;
      }
      e.preventDefault();
      showPoliteToast("Menyalin teks soal dinonaktifkan demi integritas ujian.");
    };

    const onFullscreenChange = (): void => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopyOrPaste);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopyOrPaste);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [recordViolation, showPoliteToast]);

  // Keyboard shortcuts (Alt+ArrowLeft / Alt+ArrowRight / Alt+F)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      } else if (e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleToggleFlag();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [questions.length, handleToggleFlag]);

  const toggleFullscreen = async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showPoliteToast("Browser Anda tidak mendukung mode layar penuh otomatis.");
    }
  };

  if (isLocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6">
        <div className="w-full max-w-md rounded-lg border border-[#FECACA] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#B91C1C]">
            <Lock className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[#141413]">
            Sesi Ujian Terkunci Otomatis
          </h1>
          <p className="mt-2 text-sm text-[#575652]">
            Sistem mencatat {violationCount} dari {maxViolations} batas pelanggaran perpindahan layar. Jawaban terakhir Anda telah diamankan. Silakan hubungi pengawas ruangan.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.replace("/dashboard")}>
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5] select-none">
      {/* Slim 56px Command Topbar + Progress Hairline */}
      <header className="sticky top-0 z-30 border-b border-[#E5E5E0] bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#141413]">
              {examTitle}
            </p>
            <p className="hidden truncate text-xs text-[#575652] sm:block">
              {subjectName} · {studentName} ({studentUsername})
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Auto-save indicator */}
            <div className="hidden items-center gap-1.5 text-xs text-[#575652] md:flex">
              {saveState === "saving" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0F4C5C]" strokeWidth={2} />
                  <span>Menyimpan...</span>
                </>
              ) : saveState === "error" ? (
                <span className="font-medium text-[#B91C1C]">Gagal simpan</span>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" strokeWidth={2} />
                  <span>Tersimpan</span>
                </>
              )}
            </div>

            {/* Font size switcher (A- / A / A+) */}
            <div
              role="group"
              aria-label="Pengaturan ukuran huruf soal"
              className="hidden items-center rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-0.5 sm:inline-flex"
            >
              {(
                [
                  { id: "sm", label: "A-" },
                  { id: "md", label: "A" },
                  { id: "lg", label: "A+" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontScale(opt.id)}
                  className={`rounded px-2 py-1 font-mono text-xs font-semibold cursor-pointer ${
                    fontScale === opt.id
                      ? "bg-white text-[#0F4C5C] border border-[#E5E5E0]"
                      : "text-[#575652] hover:text-[#141413]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <ExamTimer
              initialRemainingSeconds={initialRemainingSeconds}
              onExpire={() => {
                void handleFinalSubmit();
              }}
            />

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label="Mode layar penuh"
              className="hidden h-9 w-9 items-center justify-center rounded-md border border-[#E5E5E0] text-[#575652] hover:bg-[#F7F7F5] hover:text-[#141413] sm:inline-flex cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Maximize className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setPaletteOpen(true)}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
              <span className="font-mono tabular-nums">
                {answeredCount}/{questions.length}
              </span>
            </Button>
          </div>
        </div>

        {/* 3px Solid Progress Hairline */}
        <div
          className="h-[3px] w-full bg-[#E5E5E0]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres pengerjaan soal"
        >
          <div
            className="h-full bg-[#0F4C5C] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Polite Anti-Cheat Toast */}
      {toastNotice && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-md border border-[#FDE68A] bg-[#FEF3C7] px-4 py-2 text-xs font-medium text-[#78350F]">
          {toastNotice}
        </div>
      )}

      {/* Workspace Body + Desktop Right Navigator */}
      <div className="flex flex-1">
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8">
          {violationCount > 0 && (
            <div className="mb-4">
              <Alert variant="warning">
                Catatan pengawasan: {violationCount} dari {maxViolations} batas peringatan perpindahan layar.
              </Alert>
            </div>
          )}

          {currentQuestion && (
            <QuestionBody
              question={currentQuestion}
              answer={currentEntry.answer}
              eliminatedOptionIds={eliminated[currentQuestion.id] ?? []}
              fontScale={fontScale}
              splitPane={splitPane}
              onToggleSplitPane={() => setSplitPane((prev) => !prev)}
              onChangeAnswer={handleAnswerChange}
              onToggleEliminate={handleToggleEliminate}
            />
          )}
        </main>

        {/* Desktop Fixed Right Rail Navigator */}
        <aside className="hidden w-72 shrink-0 border-l border-[#E5E5E0] bg-white lg:sticky lg:top-[59px] lg:block lg:h-[calc(100vh-59px)]">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <QuestionNavigator
                items={paletteItems}
                currentIndex={currentIndex}
                onSelectIndex={setCurrentIndex}
              />
            </div>
            <div className="border-t border-[#E5E5E0] p-4">
              <Button
                className="w-full"
                onClick={() => setSubmitModalOpen(true)}
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                Kumpulkan Ujian
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Sticky Action Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E5E0] bg-white lg:right-72">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="hidden xl:inline">
              <Kbd>Alt+←</Kbd>
            </span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant={currentEntry.isFlagged ? "warning" : "outline"}
              onClick={handleToggleFlag}
            >
              <Flag className="h-4 w-4" strokeWidth={2} />
              <span>{currentEntry.isFlagged ? "Ragu-ragu" : "Tandai Ragu"}</span>
            </Button>

            {hasAnswerValue(currentEntry.answer) && (
              <Button
                variant="ghost"
                onClick={handleClearAnswer}
                aria-label="Hapus jawaban soal ini"
              >
                <Eraser className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Hapus</span>
              </Button>
            )}
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <span className="sm:hidden">Lanjut</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          ) : (
            <Button onClick={() => setSubmitModalOpen(true)}>
              <Send className="h-4 w-4" strokeWidth={2} />
              Selesai
            </Button>
          )}
        </div>
      </footer>

      {/* Mobile Palette Slide-Over Drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-[#141413]/40"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="relative flex w-80 max-w-[90vw] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] px-4 py-3">
              <span className="text-sm font-semibold text-[#141413]">
                Navigasi Soal
              </span>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                aria-label="Tutup peta soal"
                className="rounded p-1.5 text-[#575652] hover:bg-[#F1F1ED] cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuestionNavigator
                items={paletteItems}
                currentIndex={currentIndex}
                onSelectIndex={(idx) => {
                  setCurrentIndex(idx);
                  setPaletteOpen(false);
                }}
              />
            </div>
            <div className="border-t border-[#E5E5E0] p-4">
              <Button
                className="w-full"
                onClick={() => {
                  setPaletteOpen(false);
                  setSubmitModalOpen(true);
                }}
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                Kumpulkan Ujian
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheat Warning Modal */}
      <Modal
        open={warningMessage !== null}
        onClose={() => setWarningMessage(null)}
        title="Peringatan Integritas Ujian"
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Perpindahan Layar Tercatat">
            {warningMessage}
          </Alert>
          <div className="flex justify-end">
            <Button onClick={() => setWarningMessage(null)}>
              Saya Mengerti, Lanjutkan Ujian
            </Button>
          </div>
        </div>
      </Modal>

      {/* Final Submit Confirmation Modal */}
      <Modal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Konfirmasi Pengumpulan Ujian"
        description="Pastikan seluruh jawaban telah diperiksa sebelum sesi diakhiri."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] p-3">
              <p className="font-mono text-xl font-bold tabular-nums text-[#14532D]">
                {answeredCount}
              </p>
              <p className="text-xs font-medium text-[#14532D]">Terjawab</p>
            </div>
            <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] p-3">
              <p className="font-mono text-xl font-bold tabular-nums text-[#78350F]">
                {flaggedCount}
              </p>
              <p className="text-xs font-medium text-[#78350F]">Ragu-ragu</p>
            </div>
            <div className="rounded-lg border border-[#E5E5E0] bg-[#F7F7F5] p-3">
              <p className="font-mono text-xl font-bold tabular-nums text-[#141413]">
                {unansweredCount}
              </p>
              <p className="text-xs font-medium text-[#575652]">Kosong</p>
            </div>
          </div>

          {(unansweredCount > 0 || flaggedCount > 0) && (
            <Alert variant="warning">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <span>
                  Masih terdapat {unansweredCount} soal kosong dan {flaggedCount} soal ragu-ragu. Setelah dikumpulkan, jawaban tidak dapat diubah kembali.
                </span>
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Periksa Kembali
            </Button>
            <Button
              onClick={() => void handleFinalSubmit()}
              isLoading={isSubmitting}
            >
              <ShieldAlert className="h-4 w-4" strokeWidth={2} />
              Ya, Kumpulkan Sekarang
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
