import { redirect } from "next/navigation";
import { BookOpenCheck, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage(): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5] text-[#141413]">
      {/* Minimalist Top Bar */}
      <header className="w-full border-b border-[#E5E5E0] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F4C5C] text-white">
              <BookOpenCheck className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#141413]">
                {env.APP_NAME}
              </span>
              <span
                aria-hidden="true"
                className="hidden text-[#D4D4CC] sm:inline"
              >
                /
              </span>
              <span className="hidden text-xs text-[#575652] sm:inline">
                {env.SCHOOL_NAME}
              </span>
            </div>
          </div>

          <span className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] px-2.5 py-1 font-mono text-[11px] font-medium text-[#575652]">
            SMP &amp; SMA
          </span>
        </div>
      </header>

      {/* Centered Clean Login Surface */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
              Masuk ke Portal Ujian
            </h1>
            <p className="text-sm text-[#575652]">
              Gunakan NISN, NIP, atau akun operator sekolah Anda.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5E5E0] bg-white p-6 sm:p-7">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="py-5 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-[#787772]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
          <span>Sesi terenkripsi &amp; tersinkronisasi waktu server</span>
        </p>
      </footer>
    </div>
  );
}
