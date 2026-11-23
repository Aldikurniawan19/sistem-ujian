"use client";

import Image from "next/image";
import { BookOpen, Check, Columns2, Rows2, Strikethrough } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  QUESTION_TYPE_LABELS,
  type StudentAnswerValue,
  type StudentExamQuestion,
} from "@/types/domain";

export type FontScale = "sm" | "md" | "lg";

const FONT_SIZE_CLASS: Record<FontScale, string> = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
};

export interface QuestionBodyProps {
  question: StudentExamQuestion;
  answer: StudentAnswerValue;
  eliminatedOptionIds: readonly string[];
  fontScale: FontScale;
  splitPane: boolean;
  onToggleSplitPane: () => void;
  onChangeAnswer: (next: StudentAnswerValue) => void;
  onToggleEliminate: (optionId: string) => void;
}

export function QuestionBody({
  question,
  answer,
  eliminatedOptionIds,
  fontScale,
  splitPane,
  onToggleSplitPane,
  onChangeAnswer,
  onToggleEliminate,
}: QuestionBodyProps): React.JSX.Element {
  const hasStimulus = Boolean(question.stimulus && question.stimulus.trim().length > 0);
  const useSplit = hasStimulus && splitPane;
  const textClass = FONT_SIZE_CLASS[fontScale];

  const handleToggleMulti = (optionId: string): void => {
    const current = Array.isArray(answer) ? answer : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onChangeAnswer(next.length > 0 ? next : null);
  };

  const essayText = typeof answer === "string" ? answer : "";
  const wordCount =
    essayText.trim().length === 0
      ? 0
      : essayText.trim().split(/\s+/).length;

  const stimulusPanel = hasStimulus && (
    <section
      aria-label="Wacana bacaan soal"
      className={cn(
        "rounded-lg border border-[#E5E5E0] bg-white p-5 sm:p-6",
        useSplit && "lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto"
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#E5E5E0] pb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C5C]">
          <BookOpen className="h-4 w-4" strokeWidth={2} />
          <span>Wacana / Stimulus</span>
        </div>
        <button
          type="button"
          onClick={onToggleSplitPane}
          className="hidden items-center gap-1.5 rounded border border-[#E5E5E0] bg-[#F7F7F5] px-2 py-1 text-[11px] font-medium text-[#575652] hover:bg-[#F1F1ED] hover:text-[#141413] lg:inline-flex cursor-pointer"
        >
          {splitPane ? (
            <>
              <Rows2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              1 Kolom
            </>
          ) : (
            <>
              <Columns2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              2 Kolom
            </>
          )}
        </button>
      </div>
      <div className={cn("whitespace-pre-line text-[#141413]", textClass)}>
        {question.stimulus}
      </div>
    </section>
  );

  const questionPanel = (
    <section
      aria-label={`Pertanyaan nomor ${question.orderNumber}`}
      className="rounded-lg border border-[#E5E5E0] bg-white p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E0] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-md bg-[#0F4C5C] px-2.5 font-mono text-xs font-semibold tabular-nums text-white">
            Soal {question.orderNumber}
          </span>
          <Badge variant="neutral">{QUESTION_TYPE_LABELS[question.type]}</Badge>
        </div>
        <span className="font-mono text-xs text-[#575652] tabular-nums">
          Bobot {question.points} poin
        </span>
      </div>

      {question.imagePath && (
        <div className="mb-4 overflow-hidden rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-2">
          <Image
            src={question.imagePath}
            alt={`Ilustrasi soal nomor ${question.orderNumber}`}
            width={720}
            height={420}
            className="mx-auto max-h-72 w-auto object-contain"
          />
        </div>
      )}

      <p className={cn("font-medium text-[#141413] whitespace-pre-line", textClass)}>
        {question.prompt}
      </p>

      {/* Choice Options with Answer Eliminator */}
      {(question.type === "SINGLE_CHOICE" ||
        question.type === "TRUE_FALSE" ||
        question.type === "MULTIPLE_CHOICE") && (
        <div className="mt-5 space-y-2.5">
          {question.type === "MULTIPLE_CHOICE" && (
            <p className="text-xs font-medium text-[#0F4C5C]">
              Pilih lebih dari satu jawaban yang sesuai.
            </p>
          )}
          {question.options.map((opt) => {
            const isSelected =
              question.type === "MULTIPLE_CHOICE"
                ? Array.isArray(answer) && answer.includes(opt.id)
                : answer === opt.id;
            const isEliminated = eliminatedOptionIds.includes(opt.id);

            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-stretch gap-2 rounded-lg border transition-colors",
                  isSelected
                    ? "border-[#0F4C5C] bg-[#EBF4F6]"
                    : isEliminated
                      ? "border-[#E5E5E0] bg-[#F7F7F5] opacity-60"
                      : "border-[#E5E5E0] bg-white hover:border-[#0F4C5C]/50 hover:bg-[#F7F7F5]/60"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (question.type === "MULTIPLE_CHOICE") {
                      handleToggleMulti(opt.id);
                    } else {
                      onChangeAnswer(opt.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  className="flex flex-1 items-start gap-3.5 p-3.5 text-left cursor-pointer"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold transition-colors",
                      isSelected
                        ? "border-[#0F4C5C] bg-[#0F4C5C] text-white"
                        : "border-[#D4D4CC] bg-[#F7F7F5] text-[#141413]"
                    )}
                  >
                    {isSelected && question.type === "MULTIPLE_CHOICE" ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      opt.label
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-[#141413]",
                      textClass,
                      isEliminated && "line-through text-[#787772]"
                    )}
                  >
                    {opt.text}
                  </span>
                </button>

                {question.type !== "TRUE_FALSE" && (
                  <button
                    type="button"
                    onClick={() => onToggleEliminate(opt.id)}
                    aria-label={
                      isEliminated
                        ? `Batalkan coret opsi ${opt.label}`
                        : `Coret pengecoh opsi ${opt.label}`
                    }
                    title="Coret pengecoh (tidak mengubah jawaban)"
                    className={cn(
                      "flex w-10 shrink-0 items-center justify-center border-l border-[#E5E5E0] text-[#787772] transition-colors hover:bg-[#F1F1ED] hover:text-[#141413] cursor-pointer",
                      isEliminated && "bg-[#F1F1ED] text-[#B91C1C]"
                    )}
                  >
                    <Strikethrough className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <div className="mt-5 space-y-2">
          <label
            htmlFor={`short-answer-${question.id}`}
            className="block text-xs font-semibold uppercase tracking-wider text-[#575652]"
          >
            Jawaban Singkat Anda
          </label>
          <input
            id={`short-answer-${question.id}`}
            type="text"
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) =>
              onChangeAnswer(e.target.value.length > 0 ? e.target.value : null)
            }
            placeholder="Ketik jawaban singkat di sini..."
            className={cn(
              "h-12 w-full rounded-md border border-[#D4D4CC] bg-white px-4 font-mono text-[#141413] focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20",
              textClass
            )}
          />
        </div>
      )}

      {question.type === "ESSAY" && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`essay-answer-${question.id}`}
              className="text-xs font-semibold uppercase tracking-wider text-[#575652]"
            >
              Jawaban Uraian / Esai
            </label>
            <span className="font-mono text-xs tabular-nums text-[#575652]">
              {wordCount} kata
            </span>
          </div>
          <textarea
            id={`essay-answer-${question.id}`}
            rows={7}
            value={essayText}
            onChange={(e) =>
              onChangeAnswer(e.target.value.length > 0 ? e.target.value : null)
            }
            placeholder="Tuliskan uraian jawaban Anda secara jelas dan runtut..."
            className={cn(
              "w-full rounded-md border border-[#D4D4CC] bg-white p-4 text-[#141413] focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20",
              textClass
            )}
          />
        </div>
      )}
    </section>
  );

  if (useSplit) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-6">{stimulusPanel}</div>
        <div className="lg:col-span-6">{questionPanel}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {stimulusPanel}
      {questionPanel}
    </div>
  );
}
