import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET minimal 16 karakter"),
  APP_NAME: z.string().min(1).default("Aksara CBT"),
  SCHOOL_NAME: z.string().min(1).default("Sekolah Terpadu Aksara Nusantara"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_NAME: process.env.APP_NAME,
    SCHOOL_NAME: process.env.SCHOOL_NAME,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    throw new Error(
      `Konfigurasi environment tidak valid: ${JSON.stringify(formatted)}`
    );
  }

  return parsed.data;
}

export const env: AppEnv = loadEnv();
