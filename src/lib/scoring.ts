import type {
  QuestionOption,
  QuestionType,
  StudentAnswerValue,
} from "@/types/domain";

export interface GradeableQuestion {
  type: QuestionType;
  points: number;
  options: QuestionOption[];
  acceptedAnswers: string[];
}

export interface GradeResult {
  isAutoGraded: boolean;
  isCorrect: boolean | null;
  earnedPoints: number | null;
}

export function normalizeShortAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function gradeObjectiveAnswer(
  question: GradeableQuestion,
  answer: StudentAnswerValue
): GradeResult {
  if (question.type === "ESSAY") {
    return {
      isAutoGraded: false,
      isCorrect: null,
      earnedPoints: null,
    };
  }

  if (
    answer === null ||
    (typeof answer === "string" && answer.trim().length === 0) ||
    (Array.isArray(answer) && answer.length === 0)
  ) {
    return {
      isAutoGraded: true,
      isCorrect: false,
      earnedPoints: 0,
    };
  }

  if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
    if (typeof answer !== "string") {
      return { isAutoGraded: true, isCorrect: false, earnedPoints: 0 };
    }
    const correctOption = question.options.find((opt) => opt.isCorrect);
    const isCorrect = correctOption !== undefined && correctOption.id === answer;
    return {
      isAutoGraded: true,
      isCorrect,
      earnedPoints: isCorrect ? question.points : 0,
    };
  }

  if (question.type === "MULTIPLE_CHOICE") {
    if (!Array.isArray(answer)) {
      return { isAutoGraded: true, isCorrect: false, earnedPoints: 0 };
    }
    const correctIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    if (correctIds.length === 0) {
      return { isAutoGraded: true, isCorrect: false, earnedPoints: 0 };
    }

    const uniqueSubmitted = Array.from(new Set(answer));
    const correctSet = new Set(correctIds);
    const matches = uniqueSubmitted.filter((id) => correctSet.has(id)).length;
    const wrongSelections = uniqueSubmitted.length - matches;

    const exactMatch =
      matches === correctIds.length && wrongSelections === 0;

    if (exactMatch) {
      return {
        isAutoGraded: true,
        isCorrect: true,
        earnedPoints: question.points,
      };
    }

    // Proportional partial credit (clamped >= 0) for AKM-style PGK
    const ratio = Math.max(0, (matches - wrongSelections) / correctIds.length);
    const partialPoints = Math.round(question.points * ratio * 100) / 100;

    return {
      isAutoGraded: true,
      isCorrect: false,
      earnedPoints: partialPoints,
    };
  }

  if (question.type === "SHORT_ANSWER") {
    if (typeof answer !== "string") {
      return { isAutoGraded: true, isCorrect: false, earnedPoints: 0 };
    }
    const normalized = normalizeShortAnswer(answer);
    const isCorrect = question.acceptedAnswers.some(
      (expected) => normalizeShortAnswer(expected) === normalized
    );
    return {
      isAutoGraded: true,
      isCorrect,
      earnedPoints: isCorrect ? question.points : 0,
    };
  }

  return {
    isAutoGraded: false,
    isCorrect: null,
    earnedPoints: null,
  };
}

export function calculateScorePercent(totalScore: number, maxScore: number): number {
  if (maxScore <= 0) {
    return 0;
  }
  return Math.round((totalScore / maxScore) * 1000) / 10;
}

export function parseOptionsJson(raw: string | null): QuestionOption[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isQuestionOption);
  } catch {
    return [];
  }
}

export function parseAcceptedAnswersJson(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function parseAnswerJson(raw: string | null): StudentAnswerValue {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (
      Array.isArray(parsed) &&
      parsed.every((item): item is string => typeof item === "string")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function isQuestionOption(value: unknown): value is QuestionOption {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.isCorrect === "boolean"
  );
}
