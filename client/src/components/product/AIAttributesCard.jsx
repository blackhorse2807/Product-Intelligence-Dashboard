import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain } from "lucide-react";

const FIELDS = [
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "productType", label: "Product Type" },
  { key: "color", label: "Color" },
  { key: "material", label: "Material" },
  { key: "size", label: "Size" },
  { key: "gender", label: "Gender" },
];

export function AIAttributesCard({ attributes }) {
  if (!attributes) return null;

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Extracted Attributes
        </CardTitle>
        <CardDescription>Structured fields inferred from video frames + OCR</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Extraction confidence</span>
            <span className="font-medium">{attributes.confidence}%</span>
          </div>
          <Progress value={attributes.confidence} className="h-2" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{attributes[key] || "—"}</p>
            </div>
          ))}
        </div>

        {attributes.keywords?.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {attributes.keywords.map((kw) => (
                <Badge key={kw} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {attributes.labels?.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Detected labels</p>
            <div className="flex flex-wrap gap-2">
              {attributes.labels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
