import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] p-6">
      <div className="w-full max-w-md rounded-lg border border-[#E5E5E0] bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#E5E5E0] bg-[#F7F7F5] text-[#0F4C5C]">
          <FileQuestion className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-widest text-[#0F4C5C]">
          404 — Tidak Ditemukan
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#141413]">
          Halaman tidak tersedia
        </h1>
        <p className="mt-2 text-sm text-[#575652]">
          Tautan yang Anda buka mungkin telah dipindahkan atau Anda tidak memiliki akses ke sumber daya tersebut.
        </p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
