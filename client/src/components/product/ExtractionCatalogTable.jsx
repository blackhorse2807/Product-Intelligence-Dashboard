import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

const FIELD_ICONS = { filled: CheckCircle2, missing: XCircle };

function formatDisplayValue(dbKey, value) {
  if (value === null || value === undefined || value === "") return null;
  if (dbKey === "price" || dbKey === "mrp") return formatCurrency(value);
  if (dbKey === "availability") return String(value).replace(/_/g, " ");
  return String(value);
}

function FieldCard({ field }) {
  const filled = field.status === "filled";
  const Icon = filled ? FIELD_ICONS.filled : FIELD_ICONS.missing;
  const display = filled ? formatDisplayValue(field.dbKey, field.value) : null;

  return (
    <div
      className={`rounded-lg border p-3 ${
        filled ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
        <Icon className={`h-3.5 w-3.5 ${filled ? "text-emerald-400" : "text-amber-400"}`} />
      </div>
      <p className={`mt-1 text-sm ${filled ? "font-medium" : "italic text-amber-400/90"}`}>
        {filled ? display : "Not detected"}
      </p>
    </div>
  );
}

export function ExtractionCatalogTable({ catalogFields = [], ocrConfidence, showConfidence = true }) {
  const filled = catalogFields.filter((f) => f.status === "filled").length;
  const total = catalogFields.length || 1;
  const percent = Math.round((filled / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Extracted from video (OCR)
          </CardTitle>
          <Badge variant="secondary">
            {filled}/{total}
          </Badge>
        </div>
        {showConfidence && ocrConfidence > 0 && (
          <p className="text-xs text-muted-foreground">OCR confidence {ocrConfidence}%</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showConfidence && (
          <Progress value={percent} className="h-1.5" />
        )}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalogFields.map((field) => (
            <FieldCard key={field.key} field={field} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
