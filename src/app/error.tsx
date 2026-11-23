"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/states";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error("Application error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title="Halaman Mengalami Gangguan"
          message="Sistem tidak dapat memuat tampilan saat ini. Silakan coba muat ulang."
          onRetry={reset}
        />
      </div>
    </main>
  );
}
