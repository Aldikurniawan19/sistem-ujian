"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  Unlock,
  Users,
} from "lucide-react";
import {
  forceSubmitAttemptAction,
  unlockAttemptAction,
} from "@/features/monitoring/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/shared/states";
import { formatDateTimeID } from "@/lib/utils";
import type { AttemptStatus } from "@/types/domain";

export interface MonitorParticipantRow {
  studentId: string;
  studentName: string;
  username: string;
  classroomName: string;
  attemptId: string | null;
  status: AttemptStatus | "NOT_STARTED";
  answeredCount: number;
  totalQuestions: number;
  violationCount: number;
  violations: {
    id: string;
    type: string;
    detail: string | null;
    createdAt: string;
  }[];
  submittedAt: string | null;
}

export function MonitorClient({
  participants,
  maxViolations,
}: {
  participants: MonitorParticipantRow[];
  maxViolations: number;
}): React.JSX.Element {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<MonitorParticipantRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, router]);

  const activeCount = participants.filter((p) => p.status === "IN_PROGRESS").length;
  const submittedCount = participants.filter((p) => p.status === "SUBMITTED").length;
  const lockedCount = participants.filter((p) => p.status === "LOCKED").length;
  const notStartedCount = participants.filter((p) => p.status === "NOT_STARTED").length;

  const handleUnlock = (attemptId: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await unlockAttemptAction(attemptId);
      if (!res.success) setError(res.error);
    });
  };

  const handleForceSubmit = (attemptId: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await forceSubmitAttemptAction(attemptId);
      if (!res.success) setError(res.error);
    });
  };

  return (
    <div className="space-y-5">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#575652]">Mengerjakan</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#0F4C5C]">
                {activeCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#575652]">Selesai</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#15803D]">
                {submittedCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#575652]">Terkunci</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#B91C1C]">
                {lockedCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#575652]">Belum Masuk</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#575652]">
                {notStartedCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRefresh((prev) => !prev)}
        >
          {autoRefresh ? (
            <>
              <Pause className="h-3.5 w-3.5" strokeWidth={2} />
              Auto-Refresh Aktif (10d)
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
              Auto-Refresh Dijeda
            </>
          )}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          Muat Ulang
        </Button>
      </div>

      {participants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada peserta pada kelas target"
          description="Pastikan kelas yang dipilih sudah memiliki akun siswa aktif."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                <tr>
                  <th className="px-5 py-3">Peserta</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progres</th>
                  <th className="px-4 py-3">Pelanggaran</th>
                  <th className="px-5 py-3 text-right">Intervensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {participants.map((p) => {
                  const pct =
                    p.totalQuestions > 0
                      ? Math.round((p.answeredCount / p.totalQuestions) * 100)
                      : 0;

                  return (
                    <tr key={p.studentId} className="hover:bg-[#F7F7F5]/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#141413]">
                          {p.studentName}
                        </p>
                        <p className="font-mono text-xs text-[#575652]">
                          {p.username}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#575652]">
                        {p.classroomName}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.status === "SUBMITTED" ? (
                          <Badge variant="success">Selesai</Badge>
                        ) : p.status === "IN_PROGRESS" ? (
                          <Badge variant="brand">Mengerjakan</Badge>
                        ) : p.status === "LOCKED" ? (
                          <Badge variant="danger">Terkunci</Badge>
                        ) : (
                          <Badge variant="neutral">Belum Masuk</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E5E5E0]">
                            <div
                              className="h-full bg-[#0F4C5C]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs tabular-nums text-[#575652]">
                            {p.answeredCount}/{p.totalQuestions}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.violationCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedLogs(p)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#FECACA] bg-[#FEE2E2] px-2 py-0.5 font-mono text-xs font-semibold text-[#7F1D1D] hover:bg-[#FECACA] cursor-pointer"
                          >
                            <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                            {p.violationCount}/{maxViolations}
                          </button>
                        ) : (
                          <span className="font-mono text-xs text-[#575652]">
                            0/{maxViolations}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.attemptId && p.status === "LOCKED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleUnlock(p.attemptId!)}
                            >
                              <Unlock className="h-3.5 w-3.5" strokeWidth={2} />
                              Buka Kunci
                            </Button>
                          )}
                          {p.attemptId && p.status === "IN_PROGRESS" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleForceSubmit(p.attemptId!)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                              Paksa Selesai
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={selectedLogs !== null}
        onClose={() => setSelectedLogs(null)}
        title="Riwayat Log Pelanggaran"
        description={
          selectedLogs
            ? `${selectedLogs.studentName} (${selectedLogs.username})`
            : undefined
        }
      >
        {selectedLogs && (
          <div className="space-y-2.5">
            {selectedLogs.violations.map((v) => (
              <div
                key={v.id}
                className="flex items-start justify-between gap-3 rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3 text-xs"
              >
                <div>
                  <p className="font-mono font-semibold text-[#B91C1C]">
                    {v.type}
                  </p>
                  {v.detail && <p className="mt-0.5 text-[#575652]">{v.detail}</p>}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-[#575652]">
                  {formatDateTimeID(v.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
