import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExtractionFrames({ frames = [], videoUrl }) {
  const [active, setActive] = useState(0);
  const list = frames.length ? frames : [];

  if (!list.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Extracted Video Frames
          </CardTitle>
          <CardDescription>No frame previews available for this product.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const current = list[active];

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Extracted Video Frames
        </CardTitle>
        <CardDescription>
          Keyframes captured at 20%, 50%, and 80% of video duration
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary hover:underline">
              View source video
            </a>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="group relative overflow-hidden rounded-xl border border-border bg-black/40">
          <img
            src={current.imageUrl}
            alt={`Frame ${current.frameNumber}`}
            className="aspect-video w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Frame {current.frameNumber}</Badge>
              <span className="font-mono text-sm text-white/90">{current.timestamp}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="grid flex-1 grid-cols-3 gap-2">
            {list.map((frame, idx) => (
              <button
                key={frame.frameNumber}
                type="button"
                onClick={() => setActive(idx)}
                className={`overflow-hidden rounded-lg border transition-all hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 ${
                  active === idx ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <img src={frame.imageUrl} alt="" className="aspect-video w-full object-cover" />
                <div className="bg-card/90 px-2 py-1 text-center text-xs text-muted-foreground">
                  F{frame.frameNumber} · {frame.timestamp}
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActive((a) => Math.min(list.length - 1, a + 1))}
            disabled={active === list.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
