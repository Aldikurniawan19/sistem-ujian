"use client";

import { useState, useTransition } from "react";
import { Plus, School, Trash2 } from "lucide-react";
import {
  createClassroomAction,
  deleteClassroomAction,
} from "@/features/master-data/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/states";

export interface ClassroomRow {
  id: string;
  name: string;
  level: string;
  grade: number;
  academicYear: string;
  studentCount: number;
}

export function ClassroomManager({
  classrooms,
}: {
  classrooms: ClassroomRow[];
}): React.JSX.Element {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"SMP" | "SMA">("SMP");
  const [grade, setGrade] = useState("9");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLevelChange = (nextLevel: "SMP" | "SMA"): void => {
    setLevel(nextLevel);
    setGrade(nextLevel === "SMP" ? "7" : "10");
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createClassroomAction({
        name,
        level,
        grade: Number(grade),
        academicYear,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setName("");
    });
  };

  const handleDelete = (id: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await deleteClassroomAction(id);
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4 lg:self-start">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[#141413]">
            Tambah Kelas Baru
          </h2>
          <p className="text-xs text-[#575652]">
            Mendukung rombel SMP (7–9) dan SMA (10–12).
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Select
              id="classroom-level"
              label="Jenjang"
              value={level}
              onChange={(e) =>
                handleLevelChange(e.target.value as "SMP" | "SMA")
              }
            >
              <option value="SMP">SMP (Kelas 7–9)</option>
              <option value="SMA">SMA (Kelas 10–12)</option>
            </Select>

            <Select
              id="classroom-grade"
              label="Tingkat"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              {level === "SMP" ? (
                <>
                  <option value="7">Kelas 7 (VII)</option>
                  <option value="8">Kelas 8 (VIII)</option>
                  <option value="9">Kelas 9 (IX)</option>
                </>
              ) : (
                <>
                  <option value="10">Kelas 10 (X)</option>
                  <option value="11">Kelas 11 (XI)</option>
                  <option value="12">Kelas 12 (XII)</option>
                </>
              )}
            </Select>

            <Input
              id="classroom-name"
              label="Nama Rombel / Kelas"
              placeholder={level === "SMP" ? "Contoh: VIII-B" : "Contoh: XII-IPA-2"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              id="classroom-year"
              label="Tahun Ajaran"
              placeholder="2026/2027"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isPending} className="w-full">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Simpan Kelas
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-8">
        {classrooms.length === 0 ? (
          <EmptyState
            icon={School}
            title="Belum ada data kelas"
            description="Tambahkan rombel SMP atau SMA untuk mengelompokkan peserta ujian."
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                  <tr>
                    <th className="px-5 py-3">Kelas</th>
                    <th className="px-4 py-3">Jenjang</th>
                    <th className="px-4 py-3">Tahun Ajaran</th>
                    <th className="px-4 py-3">Peserta</th>
                    <th className="px-5 py-3 text-right">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {classrooms.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F7F7F5]/60">
                      <td className="px-5 py-3.5 font-semibold text-[#141413]">
                        {c.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={c.level === "SMA" ? "brand" : "neutral"}>
                          {c.level} · Tingkat {c.grade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#575652]">
                        {c.academicYear}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#141413]">
                        {c.studentCount} siswa
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(c.id)}
                          aria-label={`Hapus kelas ${c.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-[#B91C1C]" strokeWidth={1.75} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
