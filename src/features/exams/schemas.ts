import { z } from "zod";
import { EXAM_CATEGORIES, EXAM_STATUSES } from "@/types/domain";

export const createExamSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Judul ujian minimal 4 karakter")
      .max(120, "Judul ujian maksimal 120 karakter"),
    description: z.string().trim().max(500).optional().nullable(),
    category: z.enum(EXAM_CATEGORIES),
    subjectId: z.string().min(1, "Pilih mata pelajaran"),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(5, "Durasi minimal 5 menit")
      .max(300, "Durasi maksimal 300 menit"),
    startAt: z.string().min(1, "Waktu mulai wajib diisi"),
    endAt: z.string().min(1, "Waktu selesai wajib diisi"),
    shuffleQuestions: z.boolean().default(true),
    shuffleOptions: z.boolean().default(true),
    showResultToStudent: z.boolean().default(true),
    maxViolations: z.coerce.number().int().min(1).max(20).default(3),
    classroomIds: z
      .array(z.string().min(1))
      .min(1, "Pilih minimal 1 kelas peserta"),
    questionIds: z
      .array(z.string().min(1))
      .min(1, "Pilih minimal 1 butir soal dari bank soal"),
  })
  .refine(
    (data) => new Date(data.endAt).getTime() > new Date(data.startAt).getTime(),
    {
      message: "Waktu tutup ujian harus lebih akhir dari waktu buka.",
      path: ["endAt"],
    }
  );

export const updateExamStatusSchema = z.object({
  examId: z.string().min(1),
  status: z.enum(EXAM_STATUSES),
});
