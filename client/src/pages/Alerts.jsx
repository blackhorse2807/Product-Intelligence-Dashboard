import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBadge } from "@/components/alerts/AlertBadge";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/layout/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { alertService } from "@/services/alertService";
import { formatDate } from "@/utils/formatters";

export default function Alerts() {
  const { data: alerts, loading, error } = useAsync(() => alertService.getAll());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">Pricing, quality, and listing intelligence notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Monitor unresolved seller alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <LoadingState />}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading &&
            !error &&
            (alerts?.length ? (
              alerts.map((alert) => (
                <div key={alert._id} className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertBadge severity={alert.severity} />
                      <Badge variant={alert.resolved ? "success" : "warning"}>
                        {alert.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    {alert.productId?.title && (
                      <p className="text-xs text-muted-foreground">Product: {alert.productId.title}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No alerts yet.</p>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
