import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { productService } from "@/services/productService";
import { competitorService } from "@/services/competitorService";
import { ExtractionCatalogTable } from "@/components/product/ExtractionCatalogTable";
import { SavedProductData } from "@/components/product/SavedProductData";
import { ProductEditDialog } from "@/components/product/ProductEditDialog";
import { ValidationIssuesList } from "@/components/product/ValidationIssuesList";
import { EnhancedTitleCard } from "@/components/product/EnhancedTitleCard";
import { TitleSourceToggle } from "@/components/product/TitleSourceToggle";
import { CompetitorPricingDashboard } from "@/components/product/CompetitorPricingDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, PenLine } from "lucide-react";
import { hasProductPricing } from "@/utils/productPricing";

const REFRESH_INTERVAL_MS = 60_000;

export default function ProductDetails() {
  const { id } = useParams();
  const [enhancing, setEnhancing] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshCooldownSec, setRefreshCooldownSec] = useState(0);
  const lastManualRefreshRef = useRef(0);
  const { data, loading, error, refetch } = useAsync(() => productService.getById(id), [id]);

  const product = data?.product;
  const catalogFields = data?.catalogFields || [];
  const missingFields = data?.missingFields || [];
  const titleMissing = data?.titleMissing;
  const extraction = data?.extraction;
  const enhancedTitle = data?.enhancedTitle;
  const titleSource = data?.titleSource;
  const competitorPricing = data?.competitorPricing;
  const validation = data?.validation;
  const issues = validation?.issues || [];
  const manualFieldsSaved = data?.manualFieldsSaved;
  const hasPricing = data?.hasPricing ?? hasProductPricing(product);
  const pricingBootstrapped = useRef(false);

  useEffect(() => {
    pricingBootstrapped.current = false;
    lastManualRefreshRef.current = 0;
    setRefreshCooldownSec(0);
  }, [id]);

  useEffect(() => {
    if (refreshCooldownSec <= 0) return undefined;
    const timer = setInterval(() => {
      setRefreshCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldownSec]);

  const runPriceRefresh = useCallback(async () => {
    setRefreshingPrices(true);
    try {
      await competitorService.refresh(id);
      await refetch();
    } finally {
      setRefreshingPrices(false);
    }
  }, [id, refetch]);

  useEffect(() => {
    if (loading || !product || !hasPricing || pricingBootstrapped.current) return;

    const rowCount = competitorPricing?.prices?.length ?? 0;
    const hasMarketData = (competitorPricing?.analytics?.lowestCompetitorPrice ?? 0) > 0;
    if (hasMarketData && rowCount > 1) return;

    pricingBootstrapped.current = true;
    runPriceRefresh().catch(() => {
      pricingBootstrapped.current = false;
    });
  }, [loading, product, hasPricing, competitorPricing, runPriceRefresh]);

  useEffect(() => {
    if (!hasPricing || !id) return undefined;

    const interval = setInterval(() => {
      if (document.hidden) return;
      runPriceRefresh().catch(() => {});
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPricing, id, runPriceRefresh]);

  const handleEnhance = async () => {
    setEnhancing(true);
    try {
      await productService.enhanceTitle(id);
      await refetch();
    } finally {
      setEnhancing(false);
    }
  };

  const handleTitleSourceChange = async (source) => {
    await productService.setTitleSource(id, source);
    await refetch();
  };

  const handleRefreshPrices = async () => {
    const now = Date.now();
    const elapsed = now - lastManualRefreshRef.current;
    if (lastManualRefreshRef.current && elapsed < REFRESH_INTERVAL_MS) {
      setRefreshCooldownSec(Math.ceil((REFRESH_INTERVAL_MS - elapsed) / 1000));
      return;
    }

    lastManualRefreshRef.current = now;
    setRefreshCooldownSec(60);
    await runPriceRefresh();
  };

  const handleDownloadReport = async (format = "csv") => {
    setDownloadingReport(true);
    try {
      await productService.downloadReport(id, format);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleSave = async (form) => {
    await productService.update(id, form);
    await refetch();
    setEditOpen(false);
  };

  const canEnhanceTitle =
    manualFieldsSaved &&
    product?.brand?.trim() &&
    product?.category?.trim() &&
    product?.title?.trim() &&
    product.title !== "Pending Review";

  const canRefreshPricing = hasPricing;

  const pageTitle = product?.title && product.title !== "Pending Review" ? product.title : "Product";

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-12">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Products
        </Link>
        <div className="flex flex-wrap gap-2">
          {product && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => handleDownloadReport("csv")}
                disabled={downloadingReport}
              >
                <Download className="h-4 w-4" />
                {downloadingReport ? "Preparing..." : "Download report"}
              </Button>
              {!manualFieldsSaved && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
                  <PenLine className="h-4 w-4" />
                  Add details
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <h1 className="text-xl font-semibold tracking-tight line-clamp-2">{pageTitle}</h1>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {product && !loading && (
        <>
          <TitleSourceToggle titleSource={titleSource} onChange={handleTitleSourceChange} />

          {manualFieldsSaved ? (
            <SavedProductData product={product} onEdit={() => setEditOpen(true)} />
          ) : (
            <ExtractionCatalogTable
              catalogFields={catalogFields}
              ocrConfidence={extraction?.ocrConfidence}
              showConfidence
            />
          )}

          <ProductEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            product={product}
            onSave={handleSave}
            titleMissing={titleMissing}
            missingFields={missingFields}
          />

          {issues.length > 0 && <ValidationIssuesList issues={issues} />}

          <EnhancedTitleCard
            enhancedTitle={enhancedTitle}
            onEnhance={handleEnhance}
            enhancing={enhancing}
            canEnhance={canEnhanceTitle}
            manualFieldsSaved={manualFieldsSaved}
            onAddDetails={() => setEditOpen(true)}
          />

          <CompetitorPricingDashboard
            pricing={competitorPricing}
            loading={loading}
            refreshing={refreshingPrices}
            onRefresh={handleRefreshPrices}
            canRefresh={canRefreshPricing}
            refreshCooldownSec={refreshCooldownSec}
            autoRefreshIntervalSec={60}
          />
        </>
      )}
    </div>
  );
}
