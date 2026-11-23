"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaletteItem {
  questionId: string;
  orderNumber: number;
  isAnswered: boolean;
  isFlagged: boolean;
}

export interface QuestionNavigatorProps {
  items: readonly PaletteItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

type FilterMode = "ALL" | "UNANSWERED" | "FLAGGED";

export function QuestionNavigator({
  items,
  currentIndex,
  onSelectIndex,
}: QuestionNavigatorProps): React.JSX.Element {
  const [filter, setFilter] = useState<FilterMode>("ALL");

  const answeredCount = items.filter((i) => i.isAnswered).length;
  const flaggedCount = items.filter((i) => i.isFlagged).length;
  const unansweredCount = items.length - answeredCount;

  const visibleItems = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => {
      if (filter === "UNANSWERED") return !item.isAnswered;
      if (filter === "FLAGGED") return item.isFlagged;
      return true;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#E5E5E0] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#575652]">
          Peta Soal
        </h2>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-[#BBF7D0] bg-[#DCFCE7] px-2 py-1.5">
            <p className="font-mono text-sm font-bold tabular-nums text-[#14532D]">
              {answeredCount}
            </p>
            <p className="text-[11px] font-medium text-[#14532D]">Dijawab</p>
          </div>
          <div className="rounded-md border border-[#FDE68A] bg-[#FEF3C7] px-2 py-1.5">
            <p className="font-mono text-sm font-bold tabular-nums text-[#78350F]">
              {flaggedCount}
            </p>
            <p className="text-[11px] font-medium text-[#78350F]">Ragu</p>
          </div>
          <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] px-2 py-1.5">
            <p className="font-mono text-sm font-bold tabular-nums text-[#141413]">
              {unansweredCount}
            </p>
            <p className="text-[11px] font-medium text-[#575652]">Kosong</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-1">
          {(
            [
              { id: "ALL", label: "Semua" },
              { id: "UNANSWERED", label: "Kosong" },
              { id: "FLAGGED", label: "Ragu" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                filter === tab.id
                  ? "bg-white text-[#141413] border border-[#E5E5E0]"
                  : "text-[#575652] hover:text-[#141413]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {visibleItems.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#575652]">
            Tidak ada soal pada filter ini.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {visibleItems.map(({ item, idx }) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={item.questionId}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Soal nomor ${item.orderNumber}${
                    item.isAnswered ? ", sudah dijawab" : ", belum dijawab"
                  }${item.isFlagged ? ", ditandai ragu-ragu" : ""}`}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-md border font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer",
                    isCurrent &&
                      "ring-2 ring-[#0F4C5C] ring-offset-1 border-[#0F4C5C]",
                    item.isAnswered
                      ? "border-[#15803D] bg-[#15803D] text-white hover:bg-[#166534]"
                      : item.isFlagged
                        ? "border-[#D97706] bg-[#FEF3C7] text-[#78350F] hover:bg-[#FDE68A]"
                        : "border-[#D4D4CC] bg-white text-[#141413] hover:bg-[#F1F1ED]"
                  )}
                >
                  {item.orderNumber}
                  {item.isFlagged && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#D97706] text-white"
                    >
                      <Flag className="h-2 w-2" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E5E0] bg-[#F7F7F5] px-4 py-3 text-[11px] text-[#575652] space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#15803D]" />
          <span>Sudah dijawab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-[#D97706] bg-[#FEF3C7]" />
          <span>Ragu-ragu (belum dijawab)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative h-3 w-3 rounded bg-[#15803D]">
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#D97706]" />
          </span>
          <span>Sudah dijawab &amp; ditandai ragu</span>
        </div>
      </div>
    </div>
  );
}
