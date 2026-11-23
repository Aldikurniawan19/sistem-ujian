"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  User,
} from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoAccount {
  label: string;
  meta: string;
  username: string;
  password: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: "Siswa SMP · IX-A",
    meta: "Token: AKSARA",
    username: "0091234501",
    password: "siswa123",
  },
  {
    label: "Siswa SMA · XI-IPA-1",
    meta: "Token: MATEMA",
    username: "0078912301",
    password: "siswa123",
  },
  {
    label: "Guru Matematika SMA",
    meta: "NIP",
    username: "198705142015031002",
    password: "guru123",
  },
  {
    label: "Admin / Operator",
    meta: "Staff",
    username: "admin",
    password: "admin123",
  },
];

export function LoginForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const usernameError =
    state && !state.success ? state.fieldErrors?.username?.[0] : undefined;
  const passwordError =
    state && !state.success ? state.fieldErrors?.password?.[0] : undefined;

  const handleQuickFill = (account: DemoAccount): void => {
    setUsername(account.username);
    setPassword(account.password);
    setShowDemo(false);
  };

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4" noValidate>
        {state && !state.success && (
          <Alert variant="danger">{state.error}</Alert>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-[#141413]"
          >
            NISN / NIP / Username
          </label>
          <div className="relative">
            <User
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787772]"
              strokeWidth={1.75}
            />
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Contoh: 0091234501"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={usernameError ? true : undefined}
              aria-describedby={usernameError ? "username-error" : undefined}
              className={cn(
                "h-11 w-full rounded-md border border-[#D4D4CC] bg-white pl-9 pr-3 text-sm text-[#141413] placeholder:text-[#787772] transition-colors focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20",
                usernameError &&
                  "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20"
              )}
            />
          </div>
          {usernameError && (
            <p id="username-error" className="text-xs font-medium text-[#B91C1C]">
              {usernameError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#141413]"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787772]"
              strokeWidth={1.75}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={cn(
                "h-11 w-full rounded-md border border-[#D4D4CC] bg-white pl-9 pr-10 text-sm text-[#141413] placeholder:text-[#787772] transition-colors focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20",
                passwordError &&
                  "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#787772] hover:bg-[#F1F1ED] hover:text-[#141413] cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {passwordError && (
            <p id="password-error" className="text-xs font-medium text-[#B91C1C]">
              {passwordError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          className="mt-2 h-11 w-full"
          size="lg"
        >
          <span>Masuk</span>
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </form>

      {/* Discreet Collapsible Demo Account Picker */}
      <div className="border-t border-[#E5E5E0] pt-4">
        <button
          type="button"
          onClick={() => setShowDemo((prev) => !prev)}
          aria-expanded={showDemo}
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-[#575652] transition-colors hover:bg-[#F7F7F5] hover:text-[#141413] cursor-pointer"
        >
          <span>Coba dengan akun simulasi</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showDemo && "rotate-180"
            )}
            strokeWidth={1.75}
          />
        </button>

        {showDemo && (
          <div className="mt-2.5 space-y-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="flex w-full items-center justify-between rounded-md border border-[#E5E5E0] bg-[#F7F7F5] px-3 py-2 text-left transition-colors hover:border-[#0F4C5C] hover:bg-[#EBF4F6] cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[#141413]">
                    {acc.label}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[#575652]">
                    {acc.username}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] font-medium text-[#0F4C5C]">
                  {acc.meta}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
