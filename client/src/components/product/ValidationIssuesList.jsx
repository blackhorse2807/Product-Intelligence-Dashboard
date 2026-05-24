import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBadge } from "@/components/alerts/AlertBadge";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export function ValidationIssuesList({ issues = [] }) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Validation Issues
        </CardTitle>
        <CardDescription>Listing quality findings with suggested fixes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            No validation issues — listing looks good.
          </p>
        ) : (
          issues.map((issue) => (
            <div
              key={issue._id}
              className="rounded-lg border border-border p-4 transition-colors hover:border-amber-500/30 hover:bg-muted/20"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <AlertBadge severity={issue.severity} />
                <Badge variant="outline">{issue.type}</Badge>
              </div>
              <p className="text-sm font-medium">{issue.message}</p>
              {issue.suggestedFix && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">Fix:</span> {issue.suggestedFix}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
