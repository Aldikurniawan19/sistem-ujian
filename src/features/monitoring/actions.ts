"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { finalizeAttempt } from "@/features/exam-session/service";
import type { ActionResult } from "@/types/domain";

const attemptActionSchema = z.object({
  attemptId: z.string().min(1),
});

async function verifyAttemptControl(
  attemptId: string
): Promise<{ examId: string } | { error: string }> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { error: "Akses ditolak." };
  }

  const parsed = attemptActionSchema.safeParse({ attemptId });
  if (!parsed.success) {
    return { error: "ID sesi peserta tidak valid." };
  }

  const attempt = await db.examAttempt.findUnique({
    where: { id: parsed.data.attemptId },
    select: {
      id: true,
      examId: true,
      exam: { select: { creatorId: true } },
    },
  });

  if (!attempt) {
    return { error: "Sesi peserta tidak ditemukan." };
  }

  if (actor.role !== "ADMIN" && attempt.exam.creatorId !== actor.id) {
    return { error: "Anda tidak memiliki izin mengelola ujian ini." };
  }

  return { examId: attempt.examId };
}

export async function unlockAttemptAction(
  attemptId: string
): Promise<ActionResult<null>> {
  const check = await verifyAttemptControl(attemptId);
  if ("error" in check) {
    return { success: false, error: check.error };
  }

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    select: { expiresAt: true },
  });

  const now = new Date();
  const extendedExpiry =
    attempt && attempt.expiresAt > now
      ? attempt.expiresAt
      : new Date(now.getTime() + 15 * 60_000);

  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: "IN_PROGRESS",
      violationCount: 0,
      submittedAt: null,
      expiresAt: extendedExpiry,
    },
  });

  revalidatePath(`/teacher/exams/${check.examId}/monitor`);
  return { success: true, data: null };
}

export async function forceSubmitAttemptAction(
  attemptId: string
): Promise<ActionResult<null>> {
  const check = await verifyAttemptControl(attemptId);
  if ("error" in check) {
    return { success: false, error: check.error };
  }

  await finalizeAttempt(attemptId, "SUBMITTED");
  revalidatePath(`/teacher/exams/${check.examId}/monitor`);
  revalidatePath(`/teacher/exams/${check.examId}/results`);
  return { success: true, data: null };
}
