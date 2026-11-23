import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const ALERT_STYLES: Record<AlertVariant, string> = {
  info: "bg-[#EBF4F6] border-[#B8D8E0] text-[#0F4C5C]",
  success: "bg-[#DCFCE7] border-[#BBF7D0] text-[#14532D]",
  warning: "bg-[#FEF3C7] border-[#FDE68A] text-[#78350F]",
  danger: "bg-[#FEE2E2] border-[#FECACA] text-[#7F1D1D]",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps): React.JSX.Element {
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "warning"
        ? AlertTriangle
        : variant === "danger"
          ? AlertCircle
          : Info;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        ALERT_STYLES[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
