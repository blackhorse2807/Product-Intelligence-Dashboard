import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";

function ScoreRow({ label, value, hint }) {
  const color =
    value >= 80 ? "text-emerald-400" : value >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${color}`}>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ConfidenceScores({ confidence }) {
  if (!confidence) return null;

  const avg = Math.round((confidence.ai + confidence.ocr + confidence.quality) / 3);

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Confidence Scores
          </CardTitle>
          <Badge variant={avg >= 75 ? "success" : "warning"}>Overall {avg}%</Badge>
        </div>
        <CardDescription>AI, OCR, and listing quality confidence breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ScoreRow label="AI Vision Confidence" value={confidence.ai} hint="Category & attribute inference" />
        <ScoreRow label="OCR Confidence" value={confidence.ocr} hint="Packaging text recognition" />
        <ScoreRow label="Listing Quality" value={confidence.quality} hint="Validation & completeness score" />
      </CardContent>
    </Card>
  );
}
