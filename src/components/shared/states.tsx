import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#D4D4CC] bg-white px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E5E5E0] bg-[#F7F7F5] text-[#575652]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#141413]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[#575652]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Terjadi Kendala Memuat Data",
  message,
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEE2E2]/40 px-6 py-10 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C]">
        <AlertCircle className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#7F1D1D]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[#7F1D1D]/90">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E5E5E0] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-[#0F4C5C]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#575652]">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
