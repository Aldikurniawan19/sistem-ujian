import { z } from "zod";
import { VIOLATION_TYPES } from "@/types/domain";

export const startExamSchema = z.object({
  examId: z.string().min(1, "ID ujian tidak valid"),
  token: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, "Token ujian harus terdiri dari 6 karakter"),
});

export const saveAnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.union([z.string().max(10000), z.array(z.string().max(100)), z.null()]),
  isFlagged: z.boolean(),
});

export const submitExamSchema = z.object({
  attemptId: z.string().min(1),
});

export const logViolationSchema = z.object({
  attemptId: z.string().min(1),
  type: z.enum(VIOLATION_TYPES),
  detail: z.string().max(240).optional(),
});
