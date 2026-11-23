import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { PortalShell } from "@/components/shared/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const user = await requireAuth();

  return (
    <PortalShell
      user={user}
      schoolName={env.SCHOOL_NAME}
      appName={env.APP_NAME}
    >
      {children}
    </PortalShell>
  );
}
