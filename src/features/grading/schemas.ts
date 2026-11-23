import { z } from "zod";

export const gradeEssaySchema = z.object({
  attemptAnswerId: z.string().min(1),
  earnedPoints: z.coerce.number().min(0, "Skor tidak boleh negatif").max(100),
  teacherFeedback: z.string().trim().max(500).optional(),
});
