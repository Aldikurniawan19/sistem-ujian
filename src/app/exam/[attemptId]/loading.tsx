import { Skeleton } from "@/components/ui/skeleton";

export default function ExamLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="h-14 border-b border-[#E5E5E0] bg-white px-6 flex items-center justify-between">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mx-auto max-w-5xl p-6 space-y-5">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
