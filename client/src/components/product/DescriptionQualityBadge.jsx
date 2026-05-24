import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DescriptionQualityBadge({ descriptionQuality }) {
  if (!descriptionQuality) return null;

  const { score, isWeak, issues } = descriptionQuality;

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Description quality</span>
        <Badge variant={isWeak ? "warning" : "success"}>
          {score}/100 {isWeak ? "· Weak" : "· OK"}
        </Badge>
      </div>
      <Progress value={score} className="h-2" />
      {issues?.length > 0 && (
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
          {issues.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
