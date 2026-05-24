import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Wand2 } from "lucide-react";

export function EnhancedTitleCard({
  enhancedTitle,
  onEnhance,
  enhancing,
  canEnhance,
  manualFieldsSaved,
  onAddDetails,
}) {
  const hasResult = Boolean(enhancedTitle?.enhancedTitle);
  const keywords = enhancedTitle?.keywords || [];

  if (!manualFieldsSaved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Title enhancement</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Upload product details first — OCR alone is not enough to build a reliable listing title.
          </p>
          <Button type="button" className="mt-4 gap-2" onClick={onAddDetails}>
            <Upload className="h-4 w-4" />
            Add product details
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Title enhancement</CardTitle>
        {hasResult && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEnhance}
            disabled={enhancing || !canEnhance}
          >
            {enhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Regenerate"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasResult ? (
          <GenerateSection onEnhance={onEnhance} enhancing={enhancing} canEnhance={canEnhance} />
        ) : (
          <ResultsSection enhancedTitle={enhancedTitle} keywords={keywords} />
        )}
      </CardContent>
    </Card>
  );
}

function GenerateSection({ onEnhance, enhancing, canEnhance }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Button
        type="button"
        size="lg"
        className="gap-2 font-semibold"
        onClick={onEnhance}
        disabled={enhancing || !canEnhance}
      >
        {enhancing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generate enhanced title
          </>
        )}
      </Button>
      {!canEnhance && (
        <p className="mt-3 text-xs text-muted-foreground">
          Save title, brand, and category in product details first.
        </p>
      )}
    </div>
  );
}

function ResultsSection({ enhancedTitle, keywords }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Original</p>
          <p className="mt-1 text-sm">{enhancedTitle.originalTitle}</p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-xs text-primary">Enhanced</p>
          <p className="mt-1 text-sm font-medium">{enhancedTitle.enhancedTitle}</p>
        </div>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="text-xs">
              {kw}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
