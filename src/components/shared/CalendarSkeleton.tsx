import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-100">
      {Array.from({ length: 42 }).map((_, index) => (
        <div key={index} className="h-32 p-2 bg-white border border-gray-100">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-6 rounded-full skeleton-animate" />
            <Skeleton className="h-6 w-6 rounded-full skeleton-animate" />
          </div>
          <div className="mt-2 space-y-1">
            <Skeleton className="h-6 w-6 rounded-full skeleton-animate" />
            <Skeleton className="h-6 w-6 rounded-full skeleton-animate" />
          </div>
        </div>
      ))}
    </div>
  );
}
