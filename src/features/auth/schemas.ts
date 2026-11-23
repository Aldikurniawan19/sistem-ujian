import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username / NISN minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter"),
  password: z
    .string()
    .min(4, "Kata sandi minimal 4 karakter")
    .max(100, "Kata sandi maksimal 100 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
