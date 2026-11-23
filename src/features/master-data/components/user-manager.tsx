"use client";

import { useState, useTransition } from "react";
import { KeyRound, Plus, Power, Users } from "lucide-react";
import {
  createUserAction,
  resetUserPasswordAction,
  toggleUserActiveAction,
} from "@/features/master-data/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/shared/states";
import { ROLE_LABELS, type UserRole } from "@/types/domain";

export interface UserRow {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  classroomName: string | null;
}

export interface ClassroomOption {
  id: string;
  name: string;
  level: string;
}

export function UserManager({
  users,
  classrooms,
}: {
  users: UserRow[];
  classrooms: ClassroomOption[];
}): React.JSX.Element {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("siswa123");
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id ?? "");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredUsers =
    roleFilter === "ALL" ? users : users.filter((u) => u.role === roleFilter);

  const handleCreate = (event: React.FormEvent): void => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await createUserAction({
        username,
        name,
        role,
        password,
        classroomId: role === "STUDENT" ? classroomId : null,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setUsername("");
      setName("");
      setSuccessMsg("Akun pengguna baru berhasil ditambahkan.");
    });
  };

  const handleToggle = (userId: string): void => {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserActiveAction(userId);
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  const handleResetPassword = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!resetTarget) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await resetUserPasswordAction({
        userId: resetTarget.id,
        newPassword,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResetTarget(null);
      setNewPassword("");
      setSuccessMsg("Kata sandi pengguna berhasil diperbarui.");
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4 lg:self-start">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[#141413]">
            Registrasi Pengguna
          </h2>
          <p className="text-xs text-[#575652]">
            Tambahkan akun siswa (NISN), guru (NIP), atau operator.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}

            <Select
              id="user-role"
              label="Peran"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="STUDENT">Siswa (Peserta Ujian)</option>
              <option value="TEACHER">Guru / Pengawas</option>
              <option value="ADMIN">Admin / Operator</option>
            </Select>

            <Input
              id="user-username"
              label={role === "STUDENT" ? "NISN" : role === "TEACHER" ? "NIP / Username" : "Username"}
              placeholder={role === "STUDENT" ? "Contoh: 0091234599" : "Contoh: guru.fisika"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              id="user-name"
              label="Nama Lengkap"
              placeholder="Nama lengkap sesuai data sekolah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {role === "STUDENT" && (
              <Select
                id="user-classroom"
                label="Kelas"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.level} — {c.name}
                  </option>
                ))}
              </Select>
            )}

            <Input
              id="user-password"
              label="Kata Sandi Awal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isPending} className="w-full">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Tambah Pengguna
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-8">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "STUDENT", "TEACHER", "ADMIN"] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={roleFilter === tab ? "primary" : "outline"}
              onClick={() => setRoleFilter(tab)}
            >
              {tab === "ALL" ? `Semua (${users.length})` : ROLE_LABELS[tab]}
            </Button>
          ))}
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Tidak ada pengguna pada kategori ini"
            description="Tambahkan pengguna baru menggunakan formulir di sebelah kiri."
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E5E0] bg-[#F7F7F5] text-xs font-medium uppercase text-[#575652]">
                  <tr>
                    <th className="px-5 py-3">Nama &amp; Identitas</th>
                    <th className="px-4 py-3">Peran / Kelas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F7F7F5]/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#141413]">{u.name}</p>
                        <p className="font-mono text-xs text-[#575652]">
                          {u.username}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={u.role === "ADMIN" ? "brand" : "neutral"}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                          {u.classroomName && (
                            <span className="font-mono text-xs text-[#575652]">
                              {u.classroomName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.isActive ? "success" : "danger"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword("");
                            }}
                            aria-label={`Reset sandi ${u.name}`}
                          >
                            <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggle(u.id)}
                            aria-label={`Ubah status aktif ${u.name}`}
                          >
                            <Power
                              className={`h-3.5 w-3.5 ${u.isActive ? "text-[#B91C1C]" : "text-[#15803D]"}`}
                              strokeWidth={2}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        title="Reset Kata Sandi Pengguna"
        description={
          resetTarget
            ? `Atur ulang kata sandi untuk ${resetTarget.name} (${resetTarget.username}).`
            : undefined
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            id="reset-password-input"
            label="Kata Sandi Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setResetTarget(null)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              Simpan Sandi Baru
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
