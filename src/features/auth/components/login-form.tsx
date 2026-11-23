"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, LogIn, UserCheck } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DemoAccount {
  label: string;
  roleTag: string;
  username: string;
  password: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: "Siswa SMP (IX-A)",
    roleTag: "NISN",
    username: "0091234501",
    password: "siswa123",
  },
  {
    label: "Siswa SMA (XI-IPA-1)",
    roleTag: "NISN",
    username: "0078912301",
    password: "siswa123",
  },
  {
    label: "Guru Matematika SMA",
    roleTag: "NIP",
    username: "198705142015031002",
    password: "guru123",
  },
  {
    label: "Admin / Operator",
    roleTag: "ADMIN",
    username: "admin",
    password: "admin123",
  },
];

export function LoginForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleQuickFill = (account: DemoAccount): void => {
    setUsername(account.username);
    setPassword(account.password);
  };

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4" noValidate>
        {state && !state.success && (
          <Alert variant="danger">{state.error}</Alert>
        )}

        <Input
          id="username"
          name="username"
          label="Username / NISN / NIP"
          placeholder="Masukkan NISN, NIP, atau username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={
            state && !state.success ? state.fieldErrors?.username?.[0] : undefined
          }
        />

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#141413]"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={
                state && !state.success && state.fieldErrors?.password
                  ? true
                  : undefined
              }
              className="h-10 w-full rounded-md border border-[#D4D4CC] bg-white px-3 pr-10 text-sm text-[#141413] placeholder:text-[#787772] focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#575652] hover:bg-[#F1F1ED] hover:text-[#141413] cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {state && !state.success && state.fieldErrors?.password?.[0] && (
            <p className="text-xs font-medium text-[#B91C1C]">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full"
          size="lg"
        >
          <LogIn className="h-4 w-4" strokeWidth={2} />
          Masuk ke Portal Ujian
        </Button>
      </form>

      <div className="border-t border-[#E5E5E0] pt-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#575652]">
          <KeyRound className="h-3.5 w-3.5 text-[#0F4C5C]" strokeWidth={2} />
          <span>Akun Simulasi Cepat (Klik untuk mengisi)</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => handleQuickFill(acc)}
              className="flex items-center justify-between rounded-md border border-[#E5E5E0] bg-[#F7F7F5] px-3 py-2 text-left transition-colors hover:border-[#0F4C5C] hover:bg-[#EBF4F6] cursor-pointer"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#141413]">
                  {acc.label}
                </p>
                <p className="truncate font-mono text-[11px] text-[#575652]">
                  {acc.username}
                </p>
              </div>
              <UserCheck
                className="h-3.5 w-3.5 shrink-0 text-[#0F4C5C]"
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
