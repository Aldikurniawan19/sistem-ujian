import { z } from "zod";
import { DIFFICULTY_LEVELS, QUESTION_TYPES } from "@/types/domain";

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(4),
  text: z.string().trim().min(1, "Teks opsi tidak boleh kosong").max(500),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z
  .object({
    subjectId: z.string().min(1, "Pilih mata pelajaran"),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.enum(DIFFICULTY_LEVELS),
    stimulus: z.string().trim().max(5000).optional().nullable(),
    prompt: z
      .string()
      .trim()
      .min(5, "Pertanyaan minimal 5 karakter")
      .max(2000, "Pertanyaan maksimal 2000 karakter"),
    imagePath: z
      .string()
      .trim()
      .refine(
        (val) => val.length === 0 || val.startsWith("/uploads/"),
        "Path gambar tidak valid"
      )
      .optional()
      .nullable(),
    points: z.coerce.number().int().min(1).max(100),
    competencyTag: z.string().trim().max(120).optional().nullable(),
    options: z.array(questionOptionSchema).optional(),
    acceptedAnswers: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "SINGLE_CHOICE" ||
      data.type === "MULTIPLE_CHOICE" ||
      data.type === "TRUE_FALSE"
    ) {
      const opts = data.options ?? [];
      if (opts.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimal harus ada 2 pilihan jawaban.",
          path: ["options"],
        });
      }
      const correctCount = opts.filter((o) => o.isCorrect).length;
      if (data.type === "SINGLE_CHOICE" || data.type === "TRUE_FALSE") {
        if (correctCount !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pilih tepat 1 kunci jawaban yang benar.",
            path: ["options"],
          });
        }
      } else if (data.type === "MULTIPLE_CHOICE" && correctCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih minimal 1 kunci jawaban benar untuk PG Kompleks.",
          path: ["options"],
        });
      }
    }

    if (data.type === "SHORT_ANSWER") {
      const answers = data.acceptedAnswers ?? [];
      if (answers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Masukkan minimal 1 kata kunci jawaban benar.",
          path: ["acceptedAnswers"],
        });
      }
    }
  });

export const csvImportSchema = z.object({
  subjectId: z.string().min(1, "Pilih mata pelajaran tujuan"),
  csvText: z.string().trim().min(10, "Isi CSV terlalu pendek"),
});
