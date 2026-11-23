"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseOptionsJson } from "@/lib/scoring";
import { deterministicShuffle } from "@/lib/shuffle";
import {
  logViolationSchema,
  saveAnswerSchema,
  startExamSchema,
  submitExamSchema,
} from "@/features/exam-session/schemas";
import { finalizeAttempt } from "@/features/exam-session/service";
import type { ActionResult } from "@/types/domain";

export async function startExamAction(
  input: unknown
): Promise<ActionResult<{ attemptId: string }>> {
  const student = await requireActionRole(["STUDENT"]);
  if (!student) {
    return {
      success: false,
      error: "Hanya peserta (siswa) yang dapat memulai sesi ujian.",
    };
  }

  const parsed = startExamSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Token tidak valid.",
    };
  }

  const rate = checkRateLimit(`token:${student.id}:${parsed.data.examId}`, 10, 60_000);
  if (!rate.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan token. Tunggu ${rate.retryAfterSeconds} detik.`,
    };
  }

  const exam = await db.exam.findUnique({
    where: { id: parsed.data.examId },
    select: {
      id: true,
      status: true,
      token: true,
      startAt: true,
      endAt: true,
      durationMinutes: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      classrooms: { select: { classroomId: true } },
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          pointsOverride: true,
          question: {
            select: { id: true, type: true, optionsJson: true, points: true },
          },
        },
      },
    },
  });

  if (!exam || exam.status !== "PUBLISHED") {
    return { success: false, error: "Ujian tidak tersedia atau belum dibuka." };
  }

  const eligible =
    student.classroomId !== null &&
    exam.classrooms.some((c) => c.classroomId === student.classroomId);
  if (!eligible) {
    return {
      success: false,
      error: "Kelas Anda tidak terdaftar sebagai peserta ujian ini.",
    };
  }

  const now = new Date();
  if (now < exam.startAt) {
    return { success: false, error: "Jadwal ujian belum dimulai." };
  }
  if (now > exam.endAt) {
    return { success: false, error: "Batas waktu ujian ini telah berakhir." };
  }

  if (exam.token.toUpperCase() !== parsed.data.token.toUpperCase()) {
    return {
      success: false,
      error: "Token ujian tidak cocok. Periksa kembali token dari pengawas.",
    };
  }

  const existing = await db.examAttempt.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "SUBMITTED") {
      return { success: false, error: "Anda sudah menyelesaikan ujian ini." };
    }
    if (existing.status === "LOCKED") {
      return {
        success: false,
        error: "Sesi Anda terkunci. Hubungi pengawas untuk membuka kunci.",
      };
    }
    return { success: true, data: { attemptId: existing.id } };
  }

  const baseQuestionIds = exam.questions.map((eq) => eq.question.id);
  const questionOrder = exam.shuffleQuestions
    ? deterministicShuffle(baseQuestionIds, `${exam.id}:${student.id}:q`)
    : baseQuestionIds;

  const optionOrders: Record<string, string[]> = {};
  for (const eq of exam.questions) {
    const opts = parseOptionsJson(eq.question.optionsJson);
    if (opts.length === 0) continue;
    const ids = opts.map((o) => o.id);
    const shouldShuffle =
      exam.shuffleOptions &&
      (eq.question.type === "SINGLE_CHOICE" ||
        eq.question.type === "MULTIPLE_CHOICE");
    optionOrders[eq.question.id] = shouldShuffle
      ? deterministicShuffle(ids, `${exam.id}:${student.id}:${eq.question.id}`)
      : ids;
  }

  const maxScore = exam.questions.reduce(
    (sum, eq) => sum + (eq.pointsOverride ?? eq.question.points),
    0
  );

  const durationEnd = new Date(now.getTime() + exam.durationMinutes * 60_000);
  const expiresAt = durationEnd < exam.endAt ? durationEnd : exam.endAt;

  const attempt = await db.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: student.id,
      status: "IN_PROGRESS",
      startedAt: now,
      expiresAt,
      questionOrderJson: JSON.stringify(questionOrder),
      optionOrdersJson: JSON.stringify(optionOrders),
      maxScore,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/student/exams");
  return { success: true, data: { attemptId: attempt.id } };
}

export async function saveAnswerAction(
  input: unknown
): Promise<ActionResult<{ savedAt: string; expired: boolean }>> {
  const student = await requireActionRole(["STUDENT"]);
  if (!student) {
    return { success: false, error: "Sesi tidak terautentikasi." };
  }

  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Format jawaban tidak valid." };
  }

  const attempt = await db.examAttempt.findFirst({
    where: {
      id: parsed.data.attemptId,
      studentId: student.id,
    },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!attempt) {
    return { success: false, error: "Sesi ujian tidak ditemukan." };
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { success: false, error: "Sesi ujian sudah tidak aktif." };
  }

  const now = new Date();
  if (now > attempt.expiresAt) {
    await finalizeAttempt(attempt.id, "SUBMITTED");
    return {
      success: true,
      data: { savedAt: now.toISOString(), expired: true },
    };
  }

  await db.attemptAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: parsed.data.questionId,
      },
    },
    update: {
      answerJson:
        parsed.data.answer === null ? null : JSON.stringify(parsed.data.answer),
      isFlagged: parsed.data.isFlagged,
    },
    create: {
      attemptId: attempt.id,
      questionId: parsed.data.questionId,
      answerJson:
        parsed.data.answer === null ? null : JSON.stringify(parsed.data.answer),
      isFlagged: parsed.data.isFlagged,
    },
  });

  return {
    success: true,
    data: { savedAt: now.toISOString(), expired: false },
  };
}

export async function submitExamAction(
  input: unknown
): Promise<ActionResult<{ attemptId: string }>> {
  const student = await requireActionRole(["STUDENT"]);
  if (!student) {
    return { success: false, error: "Sesi tidak terautentikasi." };
  }

  const parsed = submitExamSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "ID sesi tidak valid." };
  }

  const attempt = await db.examAttempt.findFirst({
    where: {
      id: parsed.data.attemptId,
      studentId: student.id,
    },
    select: { id: true, status: true },
  });

  if (!attempt) {
    return { success: false, error: "Sesi ujian tidak ditemukan." };
  }

  if (attempt.status === "IN_PROGRESS") {
    await finalizeAttempt(attempt.id, "SUBMITTED");
  }

  revalidatePath("/dashboard");
  revalidatePath("/student/exams");
  return { success: true, data: { attemptId: attempt.id } };
}

export async function logViolationAction(
  input: unknown
): Promise<ActionResult<{ violationCount: number; maxViolations: number; locked: boolean }>> {
  const student = await requireActionRole(["STUDENT"]);
  if (!student) {
    return { success: false, error: "Sesi tidak terautentikasi." };
  }

  const parsed = logViolationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Data log tidak valid." };
  }

  const attempt = await db.examAttempt.findFirst({
    where: {
      id: parsed.data.attemptId,
      studentId: student.id,
    },
    select: {
      id: true,
      status: true,
      violationCount: true,
      exam: { select: { maxViolations: true } },
    },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return { success: false, error: "Sesi ujian sudah berakhir." };
  }

  const nextCount = attempt.violationCount + 1;
  const shouldLock = nextCount >= attempt.exam.maxViolations;

  await db.$transaction([
    db.violationLog.create({
      data: {
        attemptId: attempt.id,
        type: parsed.data.type,
        detail: parsed.data.detail ?? null,
      },
    }),
    db.examAttempt.update({
      where: { id: attempt.id },
      data: { violationCount: nextCount },
    }),
  ]);

  if (shouldLock) {
    await finalizeAttempt(attempt.id, "LOCKED");
  }

  return {
    success: true,
    data: {
      violationCount: nextCount,
      maxViolations: attempt.exam.maxViolations,
      locked: shouldLock,
    },
  };
}
