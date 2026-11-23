"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  createClassroomSchema,
  createSubjectSchema,
  createUserSchema,
  idOnlySchema,
  resetPasswordSchema,
} from "@/features/master-data/schemas";
import type { ActionResult } from "@/types/domain";

export async function createClassroomAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak. Hanya Admin yang diizinkan." };
  }

  const parsed = createClassroomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data kelas tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.classroom.findUnique({
    where: {
      name_academicYear: {
        name: parsed.data.name,
        academicYear: parsed.data.academicYear,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      error: `Kelas ${parsed.data.name} untuk tahun ajaran ${parsed.data.academicYear} sudah terdaftar.`,
    };
  }

  const created = await db.classroom.create({
    data: {
      name: parsed.data.name,
      level: parsed.data.level,
      grade: parsed.data.grade,
      academicYear: parsed.data.academicYear,
    },
    select: { id: true },
  });

  revalidatePath("/admin/classrooms");
  revalidatePath("/dashboard");
  return { success: true, data: { id: created.id } };
}

export async function deleteClassroomAction(
  id: string
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = idOnlySchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: "ID kelas tidak valid." };
  }

  await db.classroom.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/classrooms");
  revalidatePath("/dashboard");
  return { success: true, data: null };
}

export async function createSubjectAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = createSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Data mata pelajaran tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const exists = await db.subject.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (exists) {
    return {
      success: false,
      error: `Kode mata pelajaran ${parsed.data.code} sudah digunakan.`,
    };
  }

  const created = await db.subject.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      level: parsed.data.level,
    },
    select: { id: true },
  });

  revalidatePath("/admin/subjects");
  return { success: true, data: { id: created.id } };
}

export async function deleteSubjectAction(
  id: string
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = idOnlySchema.safeParse({ id });
  if (!parsed.success) {
    return { success: false, error: "ID mata pelajaran tidak valid." };
  }

  await db.subject.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/subjects");
  return { success: true, data: null };
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Periksa kembali data pengguna.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const exists = await db.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });
  if (exists) {
    return {
      success: false,
      error: `Username / NISN '${parsed.data.username}' sudah terdaftar.`,
    };
  }

  const classroomId =
    parsed.data.role === "STUDENT" && parsed.data.classroomId
      ? parsed.data.classroomId
      : null;

  const created = await db.user.create({
    data: {
      username: parsed.data.username,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: hashPassword(parsed.data.password),
      classroomId,
    },
    select: { id: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true, data: { id: created.id } };
}

export async function toggleUserActiveAction(
  userId: string
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }
  if (actor.id === userId) {
    return { success: false, error: "Anda tidak dapat menonaktifkan akun sendiri." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });
  if (!target) {
    return { success: false, error: "Pengguna tidak ditemukan." };
  }

  await db.user.update({
    where: { id: target.id },
    data: { isActive: !target.isActive },
  });

  if (target.isActive) {
    await db.session.deleteMany({ where: { userId: target.id } });
  }

  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export async function resetUserPasswordAction(
  input: unknown
): Promise<ActionResult<null>> {
  const actor = await requireActionRole(["ADMIN"]);
  if (!actor) {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Kata sandi tidak valid.",
    };
  }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });
  await db.session.deleteMany({ where: { userId: parsed.data.userId } });

  revalidatePath("/admin/users");
  return { success: true, data: null };
}
