import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileSpreadsheet } from "lucide-react";

export function MissingFieldsPrompt({
  missingFields = [],
  titleEssentialMissing = [],
  titleMissing,
  children,
}) {
  const hasTitleEssentials = titleEssentialMissing.length > 0;
  if (!missingFields.length && !hasTitleEssentials) return null;

  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          Action required — incomplete extraction
        </CardTitle>
        <CardDescription className="text-amber-200/80">
          {hasTitleEssentials &&
            "Title, brand, and category are required to build a suitable product title. "}
          {missingFields.length > 0 &&
            `${missingFields.length} field(s) could not be read from the video. `}
          Complete your listing using the options below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {titleMissing && (
          <div className="rounded-lg border border-amber-500/50 bg-black/20 p-3 text-sm">
            <strong className="text-amber-300">Product title is required.</strong> Please enter the product
            title in the form below — OCR could not detect a reliable title from the video.
          </div>
        )}

        <ul className="grid gap-2 sm:grid-cols-2">
          {titleEssentialMissing.map((f) => (
            <li
              key={f.key}
              className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium"
            >
              <FileSpreadsheet className="h-3 w-3 shrink-0 text-red-400" />
              {f.label} (required for title)
            </li>
          ))}
          {missingFields
            .filter((f) => !titleEssentialMissing.some((t) => t.key === f.key))
            .map((f) => (
              <li
                key={f.key}
                className="flex items-center gap-2 rounded-md border border-amber-500/30 px-3 py-2 text-sm"
              >
                <FileSpreadsheet className="h-3 w-3 shrink-0 text-amber-400" />
                {f.label}
              </li>
            ))}
        </ul>

        <div className="rounded-lg border border-border bg-card/80 p-4">
          <p className="mb-3 text-sm font-medium">Choose how to complete missing fields:</p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Fill manually</strong> — use the form below (recommended for
              title + a few fields)
            </li>
            <li>
              <strong className="text-foreground">Upload a CSV row</strong> — import sku, title, price, and
              other columns for this product
            </li>
          </ol>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
