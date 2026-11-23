"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn, formatCountdown } from "@/lib/utils";

export interface ExamTimerProps {
  initialRemainingSeconds: number;
  onExpire: () => void;
}

export function ExamTimer({
  initialRemainingSeconds,
  onExpire,
}: ExamTimerProps): React.JSX.Element {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor(initialRemainingSeconds))
  );
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredFiredRef.current) {
        expiredFiredRef.current = true;
        onExpire();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!expiredFiredRef.current) {
            expiredFiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const urgency =
    secondsLeft <= 300
      ? "critical"
      : secondsLeft <= 600
        ? "warning"
        : "normal";

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Sisa waktu ujian ${formatCountdown(secondsLeft)}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm font-semibold tabular-nums transition-colors",
        urgency === "critical"
          ? "border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C]"
          : urgency === "warning"
            ? "border-[#FDE68A] bg-[#FEF3C7] text-[#78350F]"
            : "border-[#E5E5E0] bg-[#F7F7F5] text-[#141413]"
      )}
    >
      <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{formatCountdown(secondsLeft)}</span>
    </div>
  );
}
