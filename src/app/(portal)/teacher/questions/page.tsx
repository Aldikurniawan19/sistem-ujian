import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseAcceptedAnswersJson, parseOptionsJson } from "@/lib/scoring";
import { PageHeader } from "@/components/shared/states";
import { QuestionBankClient } from "@/features/question-bank/components/question-bank-client";
import type { DifficultyLevel, QuestionType } from "@/types/domain";

export default async function TeacherQuestionsPage(): Promise<React.JSX.Element> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const [subjects, questions] = await Promise.all([
    db.subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, level: true },
    }),
    db.question.findMany({
      where: user.role === "TEACHER" ? { authorId: user.id } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subjectId: true,
        type: true,
        difficulty: true,
        stimulus: true,
        prompt: true,
        imagePath: true,
        optionsJson: true,
        acceptedAnswersJson: true,
        points: true,
        competencyTag: true,
        subject: { select: { name: true, code: true } },
        author: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kurikulum & Asesmen"
        title="Bank Soal Digital"
        description="Susun butir soal 5 tipe standar AKM/ANBK lengkap dengan wacana stimulus, gambar, dan impor massal CSV."
      />
      <QuestionBankClient
        subjects={subjects}
        questions={questions.map((q) => ({
          id: q.id,
          subjectId: q.subjectId,
          subjectName: q.subject.name,
          subjectCode: q.subject.code,
          authorName: q.author.name,
          type: q.type as QuestionType,
          difficulty: q.difficulty as DifficultyLevel,
          stimulus: q.stimulus,
          prompt: q.prompt,
          imagePath: q.imagePath,
          options: parseOptionsJson(q.optionsJson),
          acceptedAnswers: parseAcceptedAnswersJson(q.acceptedAnswersJson),
          points: q.points,
          competencyTag: q.competencyTag,
        }))}
      />
    </div>
  );
}
