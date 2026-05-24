import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { CATALOG_FIELDS } from "@/constants/catalogFields";

function formatValue(dbKey, value) {
  if (value === null || value === undefined || value === "") return null;
  if (dbKey === "price" || dbKey === "mrp") return formatCurrency(value);
  if (dbKey === "availability") return String(value).replace(/_/g, " ");
  return String(value);
}

export function SavedProductData({ product, onEdit }) {
  if (!product) return null;

  const rows = CATALOG_FIELDS.map((field) => {
    const value = formatValue(field.dbKey, product[field.dbKey]);
    if (!value) return null;
    return { label: field.label, value };
  }).filter(Boolean);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Product details</CardTitle>
        <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
          <PenLine className="h-4 w-4" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
