import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBadge } from "@/components/alerts/AlertBadge";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { formatDate } from "@/utils/formatters";

export function ProductAlerts({ alerts = [] }) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alerts
        </CardTitle>
        <CardDescription>Seller notifications for this product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts for this product.</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`rounded-lg border p-4 ${
                alert.severity === "HIGH"
                  ? "border-red-500/40 bg-red-500/5"
                  : alert.severity === "MEDIUM"
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border bg-muted/10"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertBadge severity={alert.severity} />
                  <Badge variant={alert.resolved ? "success" : "warning"}>
                    {alert.resolved ? "Resolved" : "Open"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</span>
              </div>
              <p className="text-sm">{alert.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
