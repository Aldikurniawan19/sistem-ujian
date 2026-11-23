export const USER_ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SCHOOL_LEVELS = ["SMP", "SMA"] as const;
export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const SUBJECT_LEVELS = ["SMP", "SMA", "ALL"] as const;
export type SubjectLevel = (typeof SUBJECT_LEVELS)[number];

export const QUESTION_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const EXAM_CATEGORIES = ["PH", "PTS", "PAS", "ANBK", "TRYOUT"] as const;
export type ExamCategory = (typeof EXAM_CATEGORIES)[number];

export const EXAM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED", "LOCKED"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const VIOLATION_TYPES = [
  "TAB_SWITCH",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
  "SHORTCUT_BLOCKED",
] as const;
export type ViolationType = (typeof VIOLATION_TYPES)[number];

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Client-safe option DTO sent to students during an active exam.
 * Deliberately omits `isCorrect` so answer keys are never leaked.
 */
export interface StudentQuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface StudentExamQuestion {
  id: string;
  orderNumber: number;
  type: QuestionType;
  difficulty: DifficultyLevel;
  stimulus: string | null;
  prompt: string;
  imagePath: string | null;
  points: number;
  options: StudentQuestionOption[];
}

export type StudentAnswerValue = string | string[] | null;

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  classroomId: string | null;
  classroomName: string | null;
  classroomLevel: SchoolLevel | null;
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Pilihan Ganda",
  MULTIPLE_CHOICE: "Pilihan Ganda Kompleks",
  TRUE_FALSE: "Benar / Salah",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Uraian / Esai",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sukar",
};

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  PH: "Penilaian Harian (PH)",
  PTS: "Sumatif Tengah Semester (STS)",
  PAS: "Sumatif Akhir Semester (SAS)",
  ANBK: "Simulasi ANBK",
  TRYOUT: "Tryout Ujian",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin / Operator",
  TEACHER: "Guru / Pengawas",
  STUDENT: "Siswa",
};
