"use client";

import { ErrorState } from "@/components/shared/states";

export default function PortalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="py-12">
      <ErrorState
        title="Gagal Memuat Halaman Portal"
        message="Terjadi kesalahan tak terduga saat memuat data. Silakan coba lagi."
        onRetry={reset}
      />
    </div>
  );
}
