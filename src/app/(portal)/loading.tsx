import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
