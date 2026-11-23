"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { parseCsvText } from "@/lib/csv";
import {
  createQuestionSchema,
  csvImportSchema,
} from "@/features/question-bank/schemas";
import type { ActionResult, DifficultyLevel, QuestionOption, QuestionType } from "@/types/domain";

export async function createQuestionAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak. Hanya guru/admin yang dapat menambah soal." };
  }

  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Data soal tidak valid.";
    return {
      success: false,
      error: firstIssue,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const created = await db.question.create({
    data: {
      subjectId: data.subjectId,
      authorId: actor.id,
      type: data.type,
      difficulty: data.difficulty,
      stimulus: data.stimulus && data.stimulus.length > 0 ? data.stimulus : null,
      prompt: data.prompt,
      imagePath: data.imagePath && data.imagePath.length > 0 ? data.imagePath : null,
      optionsJson:
        data.options && data.options.length > 0
          ? JSON.stringify(data.options)
          : null,
      acceptedAnswersJson:
        data.acceptedAnswers && data.acceptedAnswers.length > 0
          ? JSON.stringify(data.acceptedAnswers)
          : null,
      points: data.points,
      competencyTag:
        data.competencyTag && data.competencyTag.length > 0
          ? data.competencyTag
          : null,
    },
    select: { id: true },
  });

  revalidatePath("/teacher/questions");
  revalidatePath("/dashboard");
  return { success: true, data: { id: created.id } };
}

export async function deleteQuestionAction(
  questionId: string
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const existing = await db.question.findUnique({
    where: { id: questionId },
    select: { id: true, authorId: true },
  });

  if (!existing) {
    return { success: false, error: "Soal tidak ditemukan." };
  }

  if (actor.role !== "ADMIN" && existing.authorId !== actor.id) {
    return { success: false, error: "Anda hanya dapat menghapus soal milik sendiri." };
  }

  await db.question.delete({ where: { id: existing.id } });
  revalidatePath("/teacher/questions");
  revalidatePath("/dashboard");
  return { success: true, data: null };
}

/**
 * Expected CSV header:
 * type,difficulty,points,prompt,optionA,optionB,optionC,optionD,optionE,correctKey,stimulus
 */
export async function importQuestionsCsvAction(
  input: unknown
): Promise<ActionResult<{ importedCount: number }>> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = csvImportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Input CSV tidak valid.",
    };
  }

  const rows = parseCsvText(parsed.data.csvText);
  if (rows.length < 2) {
    return {
      success: false,
      error: "CSV harus berisi baris header dan minimal 1 baris soal.",
    };
  }

  const dataRows = rows.slice(1);
  let importedCount = 0;

  for (let i = 0; i < dataRows.length; i += 1) {
    const cols = dataRows[i];
    if (!cols) continue;

    const rawType = (cols[0] ?? "SINGLE_CHOICE").toUpperCase() as QuestionType;
    const rawDiff = (cols[1] ?? "MEDIUM").toUpperCase() as DifficultyLevel;
    const points = Number(cols[2] ?? "10") || 10;
    const prompt = cols[3] ?? "";
    const optTexts = [cols[4], cols[5], cols[6], cols[7], cols[8]];
    const correctKey = (cols[9] ?? "").trim();
    const stimulus = cols[10] ?? "";

    const labels = ["A", "B", "C", "D", "E"] as const;
    let options: QuestionOption[] | undefined;
    let acceptedAnswers: string[] | undefined;

    if (rawType === "SINGLE_CHOICE" || rawType === "MULTIPLE_CHOICE") {
      const correctKeys = correctKey
        .toUpperCase()
        .split("|")
        .map((k) => k.trim())
        .filter(Boolean);

      const builtOptions: QuestionOption[] = [];
      labels.forEach((label, idx) => {
        const text = optTexts[idx]?.trim() ?? "";
        if (!text) return;
        builtOptions.push({
          id: label.toLowerCase(),
          label,
          text,
          isCorrect: correctKeys.includes(label),
        });
      });
      options = builtOptions;
    } else if (rawType === "TRUE_FALSE") {
      const isTrue = correctKey.toUpperCase() === "B" || correctKey.toUpperCase() === "TRUE";
      options = [
        { id: "true", label: "B", text: "Benar", isCorrect: isTrue },
        { id: "false", label: "S", text: "Salah", isCorrect: !isTrue },
      ];
    } else if (rawType === "SHORT_ANSWER") {
      acceptedAnswers = correctKey
        .split("|")
        .map((k) => k.trim())
        .filter(Boolean);
    }

    const validated = createQuestionSchema.safeParse({
      subjectId: parsed.data.subjectId,
      type: rawType,
      difficulty: rawDiff,
      points,
      prompt,
      stimulus: stimulus || null,
      options,
      acceptedAnswers,
    });

    if (!validated.success) {
      return {
        success: false,
        error: `Baris ${i + 2} tidak valid: ${validated.error.issues[0]?.message ?? "format salah"}`,
      };
    }

    await db.question.create({
      data: {
        subjectId: validated.data.subjectId,
        authorId: actor.id,
        type: validated.data.type,
        difficulty: validated.data.difficulty,
        stimulus: validated.data.stimulus ?? null,
        prompt: validated.data.prompt,
        optionsJson: validated.data.options
          ? JSON.stringify(validated.data.options)
          : null,
        acceptedAnswersJson: validated.data.acceptedAnswers
          ? JSON.stringify(validated.data.acceptedAnswers)
          : null,
        points: validated.data.points,
      },
    });
    importedCount += 1;
  }

  revalidatePath("/teacher/questions");
  revalidatePath("/dashboard");
  return { success: true, data: { importedCount } };
}
