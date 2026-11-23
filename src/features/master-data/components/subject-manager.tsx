"use client";

import { useState, useTransition } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import {
  createSubjectAction,
  deleteSubjectAction,
} from "@/features/master-data/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/states";

export interface SubjectRow {
  id: string;
  code: string;
  name: string;
  level: string;
  questionCount: number;
}

export function SubjectManager({
  subjects,
}: {
  subjects: SubjectRow[];
}): React.JSX.Element {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"SMP" | "SMA" | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSubjectAction({ code, name, level });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCode("");
      setName("");
    });
  };

  const handleDelete = (id: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await deleteSubjectAction(id);
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
            Tambah Mata Pelajaran
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Input
              id="subject-code"
              label="Kode Mapel"
              placeholder="Contoh: BIO-SMA"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
            <Input
              id="subject-name"
              label="Nama Mata Pelajaran"
              placeholder="Contoh: Biologi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              id="subject-level"
              label="Jenjang"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as "SMP" | "SMA" | "ALL")
              }
            >
              <option value="ALL">SMP &amp; SMA</option>
              <option value="SMP">Khusus SMP</option>
              <option value="SMA">Khusus SMA</option>
            </Select>
            <Button type="submit" isLoading={isPending} className="w-full">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Simpan Mapel
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-8">
        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Belum ada mata pelajaran"
            description="Tambahkan mata pelajaran sebagai kategori untuk bank soal dan jadwal ujian."
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                  <tr>
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Jenjang</th>
                    <th className="px-4 py-3">Bank Soal</th>
                    <th className="px-5 py-3 text-right">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F7F5]/60">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#0F4C5C]">
                        {s.code}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#141413]">
                        {s.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="neutral">
                          {s.level === "ALL" ? "SMP & SMA" : s.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[#575652]">
                        {s.questionCount} soal
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(s.id)}
                          aria-label={`Hapus mapel ${s.name}`}
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
