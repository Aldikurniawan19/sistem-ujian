import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger";

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-[#F1F1ED] text-[#575652] border-[#E5E5E0]",
  brand: "bg-[#EBF4F6] text-[#0F4C5C] border-[#B8D8E0]",
  success: "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]",
  warning: "bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]",
  danger: "bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA]",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        BADGE_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
