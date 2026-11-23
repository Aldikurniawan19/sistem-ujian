"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Play } from "lucide-react";
import { startExamAction } from "@/features/exam-session/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const TOKEN_LENGTH = 6;

export function TokenConfirmClient({
  examId,
}: {
  examId: string;
}): React.JSX.Element {
  const router = useRouter();
  const [chars, setChars] = useState<string[]>(Array(TOKEN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const tokenValue = chars.join("");

  const handleChange = (index: number, raw: string): void => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleaned) {
      const next = [...chars];
      next[index] = "";
      setChars(next);
      return;
    }

    // Handle multi-char paste directly in input
    if (cleaned.length > 1) {
      const next = [...chars];
      for (let i = 0; i < TOKEN_LENGTH; i += 1) {
        next[i] = cleaned[i] ?? "";
      }
      setChars(next);
      const focusIdx = Math.min(cleaned.length, TOKEN_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();
      return;
    }

    const next = [...chars];
    next[index] = cleaned;
    setChars(next);
    if (index < TOKEN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "Backspace" && !chars[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    if (tokenValue.length !== TOKEN_LENGTH) {
      setError("Masukkan lengkap 6 karakter token ujian.");
      return;
    }

    startTransition(async () => {
      const res = await startExamAction({ examId, token: tokenValue });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(`/exam/${res.data.attemptId}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-[#141413]">
          <KeyRound className="h-4 w-4 text-[#0F4C5C]" strokeWidth={2} />
          <span>Masukkan Token Ujian (6 Karakter)</span>
        </label>
        <div
          className="grid grid-cols-6 gap-2"
          role="group"
          aria-label="Input 6 karakter token ujian"
        >
          {chars.map((char, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="text"
              maxLength={6}
              value={char}
              aria-label={`Karakter token ke-${idx + 1}`}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-12 w-full rounded-md border border-[#D4D4CC] bg-white text-center font-mono text-lg font-bold uppercase text-[#0F4C5C] focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/25 sm:h-14 sm:text-xl"
            />
          ))}
        </div>
        <p className="text-xs text-[#575652]">
          Token bersifat tidak peka huruf besar/kecil dan dapat ditempel langsung.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        isLoading={isPending}
        disabled={tokenValue.length !== TOKEN_LENGTH}
        className="w-full"
      >
        <Play className="h-4 w-4" strokeWidth={2} />
        Verifikasi Token &amp; Mulai Ujian
      </Button>
    </form>
  );
}
