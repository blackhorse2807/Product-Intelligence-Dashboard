import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Package, Sparkles } from "lucide-react";

export function ProductOverview({ product, pipeline }) {
  if (!product) return null;

  return (
    <Card className="overflow-hidden border-border/80 bg-card/80 backdrop-blur">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{product.title}</CardTitle>
            <CardDescription className="mt-1">SKU: {product.skuId}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Extracted
            </Badge>
            <Badge variant="outline">{pipeline || "video_pipeline"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Brand</p>
            <p className="font-medium">{product.brand || "—"}</p>
            <p className="mt-2 text-muted-foreground">Category</p>
            <p className="font-medium">{product.category || "—"}</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Price</p>
          <p className="text-lg font-semibold text-primary">{formatCurrency(product.price)}</p>
          <p className="mt-2 text-muted-foreground">MRP</p>
          <p className="font-medium line-through opacity-70">{formatCurrency(product.mrp)}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Quality Score</p>
          <p className="text-2xl font-bold">{product.qualityScore}%</p>
          <p className="mt-2 text-muted-foreground">Availability</p>
          <p className="font-medium capitalize">{product.availability?.replace("_", " ")}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground">Description</p>
          <p className="line-clamp-4 text-foreground/90">{product.description || "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
