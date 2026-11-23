"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
}

const SIZE_MAP: Record<"md" | "lg" | "xl", string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-lg border border-[#E5E5E0] bg-white",
          SIZE_MAP[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E5E0] px-5 py-4">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold text-[#141413]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#575652]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-md p-1.5 text-[#575652] hover:bg-[#F1F1ED] hover:text-[#141413] cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
