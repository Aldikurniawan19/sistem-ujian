import { z } from "zod";
import { SCHOOL_LEVELS, SUBJECT_LEVELS, USER_ROLES } from "@/types/domain";

export const createClassroomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kelas minimal 2 karakter (contoh: IX-A atau XI-IPA-1)")
    .max(30, "Nama kelas maksimal 30 karakter"),
  level: z.enum(SCHOOL_LEVELS),
  grade: z.coerce
    .number()
    .int()
    .min(7, "Tingkat kelas minimal 7 (SMP)")
    .max(12, "Tingkat kelas maksimal 12 (SMA)"),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus YYYY/YYYY (mis. 2026/2027)"),
}).refine(
  (data) =>
    (data.level === "SMP" && data.grade >= 7 && data.grade <= 9) ||
    (data.level === "SMA" && data.grade >= 10 && data.grade <= 12),
  {
    message: "Tingkat kelas tidak sesuai jenjang (SMP: 7–9, SMA: 10–12)",
    path: ["grade"],
  }
);

export const createSubjectSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Kode mapel minimal 2 karakter")
    .max(16, "Kode mapel maksimal 16 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf kapital, angka, dan tanda hubung"),
  name: z
    .string()
    .trim()
    .min(2, "Nama mata pelajaran minimal 2 karakter")
    .max(80, "Nama mata pelajaran maksimal 80 karakter"),
  level: z.enum(SUBJECT_LEVELS),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username / NISN / NIP minimal 3 karakter")
    .max(40, "Username maksimal 40 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Hanya huruf, angka, titik, garis bawah, atau strip"),
  name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  role: z.enum(USER_ROLES),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter")
    .max(100, "Kata sandi maksimal 100 karakter"),
  classroomId: z.string().trim().optional().nullable(),
});

export const idOnlySchema = z.object({
  id: z.string().min(1, "ID tidak valid"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter").max(100),
});
