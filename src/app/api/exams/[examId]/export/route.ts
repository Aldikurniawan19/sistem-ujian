import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { buildCsvDocument } from "@/lib/csv";
import { calculateScorePercent } from "@/lib/scoring";

export async function GET(
  _request: Request,
  context: { params: Promise<{ examId: string }> }
): Promise<NextResponse> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { examId } = await context.params;
  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      creatorId: true,
      attempts: {
        where: { status: { in: ["SUBMITTED", "LOCKED"] } },
        orderBy: [{ student: { classroom: { name: "asc" } } }, { student: { name: "asc" } }],
        select: {
          status: true,
          autoScore: true,
          manualScore: true,
          totalScore: true,
          maxScore: true,
          violationCount: true,
          submittedAt: true,
          student: {
            select: {
              username: true,
              name: true,
              classroom: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  }

  if (actor.role !== "ADMIN" && exam.creatorId !== actor.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headers = [
    "NISN",
    "Nama Peserta",
    "Kelas",
    "Status",
    "Skor Objektif",
    "Skor Esai",
    "Total Poin",
    "Poin Maksimal",
    "Nilai (0-100)",
    "Pelanggaran",
    "Waktu Selesai",
  ];

  const rows = exam.attempts.map((a) => [
    a.student.username,
    a.student.name,
    a.student.classroom?.name ?? "-",
    a.status,
    a.autoScore,
    a.manualScore,
    a.totalScore,
    a.maxScore,
    calculateScorePercent(a.totalScore, a.maxScore),
    a.violationCount,
    a.submittedAt ? a.submittedAt.toISOString() : "-",
  ]);

  const csv = buildCsvDocument(headers, rows);
  const safeSlug = exam.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rekap-${safeSlug || "ujian"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
