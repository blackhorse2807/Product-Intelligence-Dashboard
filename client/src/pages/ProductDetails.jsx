import { useEffect, useRef, useState } from "react";
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
import { ArrowLeft, PenLine } from "lucide-react";
import { hasProductPricing } from "@/utils/productPricing";

export default function ProductDetails() {
  const { id } = useParams();
  const [enhancing, setEnhancing] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
  }, [id]);

  useEffect(() => {
    if (loading || !product || !hasPricing || pricingBootstrapped.current) return;

    const rowCount = competitorPricing?.prices?.length ?? 0;
    const hasMarketData = (competitorPricing?.analytics?.lowestCompetitorPrice ?? 0) > 0;
    if (hasMarketData && rowCount > 1) return;

    pricingBootstrapped.current = true;
    (async () => {
      setRefreshingPrices(true);
      try {
        await competitorService.refresh(id);
        await refetch();
      } catch {
        pricingBootstrapped.current = false;
      } finally {
        setRefreshingPrices(false);
      }
    })();
  }, [loading, product, hasPricing, competitorPricing, id, refetch]);

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
    setRefreshingPrices(true);
    try {
      await competitorService.refresh(id);
      await refetch();
    } finally {
      setRefreshingPrices(false);
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
        {!manualFieldsSaved && (
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <PenLine className="h-4 w-4" />
            Add details
          </Button>
        )}
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
            manualFieldsSaved={manualFieldsSaved}
          />
        </>
      )}
    </div>
  );
}
