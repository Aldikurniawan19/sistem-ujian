"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/features/auth/schemas";
import type { ActionResult } from "@/types/domain";

export async function loginAction(
  _prevState: ActionResult<{ redirectTo: string }> | null,
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");

  const parsed = loginSchema.safeParse({
    username: typeof rawUsername === "string" ? rawUsername : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Periksa kembali NISN/NIP dan kata sandi Anda.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for") ?? "local";
  const ip = forwarded.split(",")[0]?.trim() ?? "local";
  const rate = checkRateLimit(
    `login:${ip}:${parsed.data.username.toLowerCase()}`,
    10,
    60_000
  );

  if (!rate.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${rate.retryAfterSeconds} detik.`,
    };
  }

  const user = await db.user.findUnique({
    where: { username: parsed.data.username },
    select: {
      id: true,
      passwordHash: true,
      isActive: true,
      role: true,
    },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return {
      success: false,
      error: "Username/NISN atau kata sandi salah.",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: "Akun Anda sedang dinonaktifkan. Hubungi operator sekolah.",
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
