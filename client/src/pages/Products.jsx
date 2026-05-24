import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsTable } from "@/components/tables/ProductsTable";
import { LoadingState } from "@/components/layout/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { productService } from "@/services/productService";

export default function Products() {
  const { data: products, loading, error } = useAsync(() => productService.getAll());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage catalog listings and listing quality</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>All products imported via video or CSV</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <LoadingState />}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && <ProductsTable data={products || []} />}
        </CardContent>
      </Card>
    </div>
  );
}
