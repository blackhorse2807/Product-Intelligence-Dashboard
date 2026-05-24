import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanText } from "lucide-react";

export function OCRResults({ ocr }) {
  if (!ocr) return null;

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ScanText className="h-5 w-5 text-primary" />
            OCR Results
          </CardTitle>
          <Badge variant={ocr.overallConfidence >= 70 ? "success" : "warning"}>
            {ocr.overallConfidence}% confidence
          </Badge>
          {ocr.partial && <Badge variant="warning">Partial extraction</Badge>}
        </div>
        <CardDescription>Text detected on product packaging via Tesseract.js</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Combined OCR Text
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-black/30 p-4 font-mono text-sm leading-relaxed text-emerald-300/90">
            {ocr.combinedText || "No text detected."}
          </pre>
        </div>

        {(ocr.detectedBrands?.length > 0 || ocr.packagingKeywords?.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {ocr.detectedBrands?.map((b) => (
              <Badge key={b} variant="outline">
                Brand: {b}
              </Badge>
            ))}
            {ocr.packagingKeywords?.map((k) => (
              <Badge key={k} variant="secondary">
                {k}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Per-frame OCR</p>
          {ocr.frames?.map((frame) => (
            <div
              key={frame.frameNumber}
              className="rounded-lg border border-border/80 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Frame {frame.frameNumber} · {frame.timestamp}
                </span>
                <span>{frame.confidence}%</span>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-foreground/80">
                {frame.extractedText || "(empty)"}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
