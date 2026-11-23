import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/states";
import { UserManager } from "@/features/master-data/components/user-manager";
import type { UserRole } from "@/types/domain";

export default async function UsersPage(): Promise<React.JSX.Element> {
  await requireRole(["ADMIN"]);

  const [users, classrooms] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        classroom: { select: { name: true } },
      },
    }),
    db.classroom.findMany({
      orderBy: [{ level: "asc" }, { grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true, level: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data · Akses & Peserta"
        title="Pengguna & Peserta Ujian"
        description="Kelola akun siswa (NISN), guru pengawas (NIP), serta status aktif dan reset kata sandi."
      />
      <UserManager
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role as UserRole,
          isActive: u.isActive,
          classroomName: u.classroom?.name ?? null,
        }))}
        classrooms={classrooms}
      />
    </div>
  );
}
