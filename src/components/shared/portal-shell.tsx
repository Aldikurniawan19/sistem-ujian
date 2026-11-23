"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type SessionUser, type UserRole } from "@/types/domain";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles: readonly UserRole[];
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Ringkasan",
    icon: LayoutDashboard,
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/student/exams",
    label: "Daftar Ujian",
    icon: ClipboardList,
    roles: ["STUDENT"],
  },
  {
    href: "/teacher/questions",
    label: "Bank Soal",
    icon: FileQuestion,
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/teacher/exams",
    label: "Jadwal & Pengawasan",
    icon: ClipboardList,
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/admin/classrooms",
    label: "Kelas SMP & SMA",
    icon: School,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/subjects",
    label: "Mata Pelajaran",
    icon: BookOpen,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/users",
    label: "Pengguna & Peserta",
    icon: Users,
    roles: ["ADMIN"],
  },
];

export interface PortalShellProps {
  user: SessionUser;
  schoolName: string;
  appName: string;
  children: ReactNode;
}

export function PortalShell({
  user,
  schoolName,
  appName,
  children,
}: PortalShellProps): React.JSX.Element {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const renderNavLinks = (onNavigate?: () => void): React.JSX.Element => (
    <nav aria-label="Navigasi utama" className="space-y-1 px-3 py-4">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#EBF4F6] text-[#0F4C5C] border border-[#B8D8E0]"
                : "text-[#575652] border border-transparent hover:bg-[#F1F1ED] hover:text-[#141413]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#E5E5E0] bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[#E5E5E0] px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#0F4C5C] text-white">
            <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#141413]">
              {appName}
            </p>
            <p className="truncate text-xs text-[#575652]">{schoolName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>

        <div className="border-t border-[#E5E5E0] p-4">
          <div className="rounded-md border border-[#E5E5E0] bg-[#F7F7F5] p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="brand">{ROLE_LABELS[user.role]}</Badge>
              {user.classroomName && (
                <span className="font-mono text-xs font-medium text-[#575652]">
                  {user.classroomName}
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-[#141413]">
              {user.name}
            </p>
            <p className="truncate font-mono text-xs text-[#575652]">
              {user.username}
            </p>
            <form action={logoutAction} className="mt-3">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E5E5E0] bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F4C5C] text-white">
            <GraduationCap className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold text-[#141413]">
            {appName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Buka menu navigasi"
          className="rounded-md border border-[#E5E5E0] p-2 text-[#141413] hover:bg-[#F1F1ED] cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Menu className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#141413]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 max-w-[85vw] flex-col border-r border-[#E5E5E0] bg-white">
            <div className="flex h-14 items-center justify-between border-b border-[#E5E5E0] px-4">
              <span className="text-sm font-semibold text-[#141413]">
                {schoolName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-md p-1.5 text-[#575652] hover:bg-[#F1F1ED] cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </div>
            <div className="border-t border-[#E5E5E0] p-4">
              <p className="text-sm font-semibold text-[#141413]">
                {user.name}
              </p>
              <p className="font-mono text-xs text-[#575652]">
                {user.username}
              </p>
              <form action={logoutAction} className="mt-3">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                  Keluar
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
