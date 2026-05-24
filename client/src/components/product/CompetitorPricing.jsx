import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { TrendingUp } from "lucide-react";

export function CompetitorPricing({ prices = [], productPrice }) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Competitor Pricing
        </CardTitle>
        <CardDescription>Cross-platform price intelligence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No competitor data yet.</p>
        ) : (
          prices.map((row) => {
            const diff = productPrice ? row.competitorPrice - productPrice : 0;
            const cheaper = diff < 0;

            return (
              <div
                key={row._id}
                className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{row.platform}</p>
                  <p className="text-xs text-muted-foreground">Checked {formatDate(row.lastCheckedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(row.competitorPrice)}</p>
                  {productPrice > 0 && (
                    <p className={`text-xs ${cheaper ? "text-red-400" : "text-emerald-400"}`}>
                      {cheaper ? `${formatCurrency(Math.abs(diff))} cheaper` : `${formatCurrency(diff)} higher`}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
