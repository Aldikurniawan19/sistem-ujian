import { parseOptionsJson } from "@/lib/scoring";
import type {
  DifficultyLevel,
  QuestionType,
  StudentExamQuestion,
  StudentQuestionOption,
} from "@/types/domain";

export interface RawExamQuestionRecord {
  pointsOverride: number | null;
  question: {
    id: string;
    type: string;
    difficulty: string;
    stimulus: string | null;
    prompt: string;
    imagePath: string | null;
    optionsJson: string | null;
    points: number;
  };
}

/**
 * Pure mapper that constructs client-safe questions for a student's attempt
 * using persisted question & option order. Deliberately omits answer keys (`isCorrect`).
 */
export function buildStudentQuestions(
  examQuestions: readonly RawExamQuestionRecord[],
  questionOrderJson: string,
  optionOrdersJson: string
): StudentExamQuestion[] {
  const questionMap = new Map(examQuestions.map((eq) => [eq.question.id, eq]));

  let orderedIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(questionOrderJson);
    if (Array.isArray(parsed)) {
      orderedIds = parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    orderedIds = examQuestions.map((eq) => eq.question.id);
  }

  let optionOrderMap: Record<string, string[]> = {};
  try {
    const parsed: unknown = JSON.parse(optionOrdersJson);
    if (typeof parsed === "object" && parsed !== null) {
      optionOrderMap = parsed as Record<string, string[]>;
    }
  } catch {
    optionOrderMap = {};
  }

  const displayLabels = ["A", "B", "C", "D", "E"] as const;
  const result: StudentExamQuestion[] = [];

  orderedIds.forEach((qId, idx) => {
    const eq = questionMap.get(qId);
    if (!eq) return;

    const rawOptions = parseOptionsJson(eq.question.optionsJson);
    const desiredOrder = optionOrderMap[qId];

    let orderedRaw = rawOptions;
    if (desiredOrder && desiredOrder.length === rawOptions.length) {
      const optMap = new Map(rawOptions.map((o) => [o.id, o]));
      orderedRaw = desiredOrder
        .map((id) => optMap.get(id))
        .filter((item): item is (typeof rawOptions)[number] => item !== undefined);
    }

    const safeOptions: StudentQuestionOption[] = orderedRaw.map((opt, optIdx) => ({
      id: opt.id,
      label:
        eq.question.type === "TRUE_FALSE"
          ? opt.label
          : (displayLabels[optIdx] ?? opt.label),
      text: opt.text,
    }));

    result.push({
      id: eq.question.id,
      orderNumber: idx + 1,
      type: eq.question.type as QuestionType,
      difficulty: eq.question.difficulty as DifficultyLevel,
      stimulus: eq.question.stimulus,
      prompt: eq.question.prompt,
      imagePath: eq.question.imagePath,
      points: eq.pointsOverride ?? eq.question.points,
      options: safeOptions,
    });
  });

  return result;
}
