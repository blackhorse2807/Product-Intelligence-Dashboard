import { Package, AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QualityChart } from "@/components/dashboard/QualityChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsTable } from "@/components/tables/ProductsTable";
import { LoadingState } from "@/components/layout/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/dashboardService";
import { productService } from "@/services/productService";

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useAsync(() => dashboardService.getQualitySummary());
  const { data: products, loading: productsLoading } = useAsync(() => productService.getAll());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Product intelligence overview for e-commerce sellers
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={summaryLoading ? "—" : summary?.totalProducts ?? 0}
          subtitle="Active catalog listings"
          icon={Package}
        />
        <MetricCard
          title="Avg Quality Score"
          value={summaryLoading ? "—" : `${summary?.averageQualityScore ?? 0}%`}
          subtitle="Listing health index"
          icon={TrendingUp}
        />
        <MetricCard
          title="Open Alerts"
          value={summaryLoading ? "—" : summary?.openAlerts ?? 0}
          subtitle="Requires attention"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Enhanced Titles"
          value={productsLoading ? "—" : products?.filter((p) => p.enhancedTitle)?.length ?? 0}
          subtitle="AI-optimized listings"
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <QualityChart
          data={
            summary?.qualityDistribution
              ? [
                  { name: "Excellent", value: summary.qualityDistribution.excellent },
                  { name: "Good", value: summary.qualityDistribution.good },
                  { name: "Needs Work", value: summary.qualityDistribution.needsWork },
                ]
              : undefined
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>Issue Severity</CardTitle>
            <CardDescription>Validation findings by severity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summaryLoading ? (
              <LoadingState rows={3} />
            ) : (
              <>
                <div className="flex justify-between"><span>High</span><span>{summary?.issuesBySeverity?.HIGH ?? 0}</span></div>
                <div className="flex justify-between"><span>Medium</span><span>{summary?.issuesBySeverity?.MEDIUM ?? 0}</span></div>
                <div className="flex justify-between"><span>Low</span><span>{summary?.issuesBySeverity?.LOW ?? 0}</span></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
          <CardDescription>Latest catalog entries</CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? <LoadingState /> : <ProductsTable data={products || []} />}
        </CardContent>
      </Card>
    </div>
  );
}
