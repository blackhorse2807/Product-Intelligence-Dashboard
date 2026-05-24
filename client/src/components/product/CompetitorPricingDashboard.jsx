import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatRelativeTime } from "@/utils/formatters";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_VARIANT = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "success",
};

function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const variant = SEVERITY_VARIANT[recommendation.severity] || "secondary";
  const Icon =
    recommendation.icon === "warning"
      ? AlertTriangle
      : recommendation.icon === "insight"
        ? Lightbulb
        : CheckCircle2;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        variant === "danger" && "border-red-500/30 bg-red-500/10",
        variant === "warning" && "border-amber-500/30 bg-amber-500/10",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/10"
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">{recommendation.message}</p>
        <p className="mt-1 text-sm text-muted-foreground">{recommendation.action}</p>
        <Badge variant={variant} className="mt-2">
          {recommendation.severity}
        </Badge>
      </div>
    </div>
  );
}

function AnalyticsGrid({ analytics }) {
  if (!analytics) return null;

  const cards = [
    { label: "Lowest competitor", value: formatCurrency(analytics.lowestCompetitorPrice) },
    { label: "Highest competitor", value: formatCurrency(analytics.highestCompetitorPrice) },
    { label: "Average market", value: formatCurrency(analytics.averageCompetitorPrice) },
    {
      label: "Price gap",
      value: formatCurrency(analytics.priceGap),
      sub: analytics.priceGap > 0 ? "above lowest" : "below lowest",
    },
    {
      label: "% vs lowest",
      value: `${analytics.percentageDifference}%`,
      sub: analytics.percentageDifference > 0 ? "higher" : "lower",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border/60 bg-muted/10 p-4 transition-colors hover:border-primary/30"
        >
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-lg font-semibold">{card.value}</p>
          {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function CompetitorPricingDashboard({
  pricing,
  loading,
  refreshing,
  onRefresh,
  canRefresh,
  refreshCooldownSec = 0,
  autoRefreshIntervalSec = 60,
}) {
  if (!canRefresh) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Competitor pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set Price or MRP in product details (both must be greater than zero) to run competitor analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { prices = [], analytics, recommendation, lastCheckedAt } = pricing || {};
  const refreshDisabled = refreshing || refreshCooldownSec > 0;
  const refreshLabel =
    refreshCooldownSec > 0
      ? `Refresh in ${refreshCooldownSec}s`
      : refreshing
        ? "Refreshing..."
        : "Refresh prices";

  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Competitor pricing intelligence</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Flipkart vs Amazon, Myntra, Ajio & more · Auto-refresh every {autoRefreshIntervalSec}s ·{" "}
              {lastCheckedAt
                ? `Last refreshed ${formatRelativeTime(lastCheckedAt)}`
                : "Estimated from your saved price & MRP"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {refreshLabel}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <AnalyticsGrid analytics={analytics} />
            <RecommendationCard recommendation={recommendation} />

            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((row) => {
                    const diff = row.priceDifference ?? 0;
                    const isOwn = row.isOwnPlatform || row.platform === "Flipkart";
                    const flipkartHigher = diff > 0;

                    return (
                      <TableRow
                        key={row.platform}
                        className={cn(isOwn && "bg-primary/5", "hover:bg-muted/20")}
                      >
                        <TableCell className="font-medium">
                          {row.platform}
                          {isOwn && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(row.competitorPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwn ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-sm",
                                flipkartHigher ? "text-red-400" : "text-emerald-400"
                              )}
                            >
                              {flipkartHigher ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                              {diff > 0 ? "+" : ""}
                              {formatCurrency(diff)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
