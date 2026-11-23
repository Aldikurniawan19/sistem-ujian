"use client";

import { ErrorState } from "@/components/shared/states";

export default function ExamError({
  reset,
}: {
  error: Error;
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title="Lembar Ujian Gagal Dimuat"
          message="Jawaban yang telah Anda pilih tetap tersimpan di server. Silakan muat ulang lembar ujian."
          onRetry={reset}
        />
      </div>
    </main>
  );
}
