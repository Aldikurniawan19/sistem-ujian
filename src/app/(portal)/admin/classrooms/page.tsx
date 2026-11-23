import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/states";
import { ClassroomManager } from "@/features/master-data/components/classroom-manager";

export default async function ClassroomsPage(): Promise<React.JSX.Element> {
  await requireRole(["ADMIN"]);

  const rows = await db.classroom.findMany({
    orderBy: [{ level: "asc" }, { grade: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      grade: true,
      academicYear: true,
      _count: { select: { students: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data · Akademik"
        title="Manajemen Kelas SMP & SMA"
        description="Kelola rombongan belajar jenjang SMP (kelas 7–9) dan SMA (kelas 10–12) untuk penugasan ujian."
      />
      <ClassroomManager
        classrooms={rows.map((r) => ({
          id: r.id,
          name: r.name,
          level: r.level,
          grade: r.grade,
          academicYear: r.academicYear,
          studentCount: r._count.students,
        }))}
      />
    </div>
  );
}
