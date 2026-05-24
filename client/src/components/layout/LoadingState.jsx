import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 4, label }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <div className="w-full max-w-md space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
