import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { SchoolLevel, SessionUser, UserRole } from "@/types/domain";

export const SESSION_COOKIE_NAME = "aksara_cbt_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 hours

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256")
    .update(`${rawToken}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    await db.session.deleteMany({
      where: { tokenHash },
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await db.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          classroomId: true,
          classroom: {
            select: {
              name: true,
              level: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date() || !session.user.isActive) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  const role = session.user.role as UserRole;
  const classroomLevel = (session.user.classroom?.level ?? null) as SchoolLevel | null;

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role,
    classroomId: session.user.classroomId,
    classroomName: session.user.classroom?.name ?? null,
    classroomLevel,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(
  allowedRoles: readonly UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireActionRole(
  allowedRoles: readonly UserRole[]
): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  return user;
}
