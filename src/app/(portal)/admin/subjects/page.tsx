import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/states";
import { SubjectManager } from "@/features/master-data/components/subject-manager";

export default async function SubjectsPage(): Promise<React.JSX.Element> {
  await requireRole(["ADMIN"]);

  const rows = await db.subject.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      level: true,
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data · Kurikulum"
        title="Mata Pelajaran"
        description="Daftar mata pelajaran yang digunakan sebagai kategori Bank Soal dan jadwal asesmen."
      />
      <SubjectManager
        subjects={rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level: r.level,
          questionCount: r._count.questions,
        }))}
      />
    </div>
  );
}
