import { redirect } from "next/navigation";
import {
  BookOpenCheck,
  Clock,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { LoginForm } from "@/features/auth/components/login-form";

const PILLARS = [
  {
    icon: Layers,
    title: "Format Soal Standar AKM & Kurikulum",
    desc: "Mendukung Pilihan Ganda 4/5 opsi, PG Kompleks, Benar/Salah, Isian Singkat, hingga Esai dengan tampilan split-pane wacana.",
  },
  {
    icon: Clock,
    title: "Sinkronisasi Waktu & Auto-Save Server",
    desc: "Sisa waktu dihitung otoritatif dari server dengan penyimpanan otomatis setiap perubahan jawaban peserta.",
  },
  {
    icon: ShieldCheck,
    title: "Pengawasan Transparan & Anti-Kecurangan",
    desc: "Token sesi 6 karakter, acak soal dan opsi independen, serta pencatatan perpindahan tab secara real-time.",
  },
];

export default async function LoginPage(): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
      {/* Editorial Brand Panel (Solid Deep Petrol, Zero Gradients) */}
      <section className="flex flex-col justify-between border-b border-[#0A3844] bg-[#0F4C5C] p-6 text-white lg:col-span-6 lg:border-b-0 lg:border-r lg:p-12 xl:col-span-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-[#0A3844]">
            <BookOpenCheck className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">{env.APP_NAME}</p>
            <p className="text-xs text-white/75">{env.SCHOOL_NAME}</p>
          </div>
        </div>

        <div className="my-10 max-w-xl space-y-6 lg:my-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-[#0A3844] px-3 py-1 font-mono text-xs uppercase tracking-wider text-white/90">
            SMP &amp; SMA · Tahun Ajaran 2026/2027
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Ruang asesmen digital yang tenang, terukur, dan berintegritas.
          </h1>
          <p className="text-sm leading-relaxed text-white/80 sm:text-base">
            Dirancang untuk kenyamanan membaca jangka panjang siswa SMP dan SMA sekaligus memberi pengawas kendali penuh dari bank soal hingga analisis butir.
          </p>

          <div className="grid gap-4 border-t border-white/15 pt-6">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-[#0A3844]">
                    <Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/75">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="font-mono text-xs text-white/60">
          Token Ujian Simulasi: AKSARA (SMP IX-A) · MATEMA (SMA XI-IPA-1)
        </p>
      </section>

      {/* Focused Login Surface */}
      <section className="flex items-center justify-center bg-[#F7F7F5] p-6 sm:p-10 lg:col-span-6 xl:col-span-5">
        <div className="w-full max-w-md rounded-lg border border-[#E5E5E0] bg-white p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-[#0F4C5C]">
              Masuk Akun
            </p>
            <h2 className="text-xl font-semibold text-[#141413]">
              Selamat datang di {env.APP_NAME}
            </h2>
            <p className="text-sm text-[#575652]">
              Gunakan NISN (siswa), NIP (guru), atau akun operator sekolah.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
