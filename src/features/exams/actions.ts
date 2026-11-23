"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { generateExamToken } from "@/lib/shuffle";
import {
  createExamSchema,
  updateExamStatusSchema,
} from "@/features/exams/schemas";
import type { ActionResult } from "@/types/domain";

export async function createExamAction(
  input: unknown
): Promise<ActionResult<{ id: string; token: string }>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data jadwal ujian tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const token = generateExamToken(6);

  const created = await db.exam.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category,
      subjectId: data.subjectId,
      creatorId: actor.id,
      durationMinutes: data.durationMinutes,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      token,
      shuffleQuestions: data.shuffleQuestions,
      shuffleOptions: data.shuffleOptions,
      showResultToStudent: data.showResultToStudent,
      maxViolations: data.maxViolations,
      status: "PUBLISHED",
      classrooms: {
        create: data.classroomIds.map((classroomId) => ({ classroomId })),
      },
      questions: {
        create: data.questionIds.map((questionId, idx) => ({
          questionId,
          orderIndex: idx,
        })),
      },
    },
    select: { id: true, token: true },
  });

  revalidatePath("/teacher/exams");
  revalidatePath("/dashboard");
  return { success: true, data: created };
}

export async function rotateExamTokenAction(
  examId: string
): Promise<ActionResult<{ token: string }>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: { id: true, creatorId: true },
  });
  if (!exam) {
    return { success: false, error: "Jadwal ujian tidak ditemukan." };
  }
  if (actor.role !== "ADMIN" && exam.creatorId !== actor.id) {
    return { success: false, error: "Anda tidak memiliki izin mengubah token ujian ini." };
  }

  const nextToken = generateExamToken(6);
  await db.exam.update({
    where: { id: exam.id },
    data: { token: nextToken },
  });

  revalidatePath("/teacher/exams");
  revalidatePath(`/teacher/exams/${exam.id}/monitor`);
  return { success: true, data: { token: nextToken } };
}

export async function updateExamStatusAction(
  input: unknown
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = updateExamStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Status ujian tidak valid." };
  }

  const exam = await db.exam.findUnique({
    where: { id: parsed.data.examId },
    select: { id: true, creatorId: true },
  });
  if (!exam) {
    return { success: false, error: "Ujian tidak ditemukan." };
  }
  if (actor.role !== "ADMIN" && exam.creatorId !== actor.id) {
    return { success: false, error: "Akses ditolak untuk ujian ini." };
  }

  await db.exam.update({
    where: { id: exam.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/teacher/exams");
  revalidatePath("/dashboard");
  return { success: true, data: null };
}
