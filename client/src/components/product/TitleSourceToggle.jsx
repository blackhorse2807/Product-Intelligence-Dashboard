import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TitleSourceToggle({ titleSource, onChange, disabled }) {
  const [switching, setSwitching] = useState(false);

  if (!titleSource?.hasEnhanced) return null;

  const active = titleSource.active === "enhanced" ? "enhanced" : "original";
  const displayTitle = titleSource.currentTitle;

  const handleSelect = async (source) => {
    if (source === active || switching || disabled) return;
    setSwitching(true);
    try {
      await onChange(source);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            disabled={switching || disabled}
            onClick={() => handleSelect("original")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active === "original"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Original title
          </button>
          <button
            type="button"
            disabled={switching || disabled}
            onClick={() => handleSelect("enhanced")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active === "enhanced"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Enhanced title
          </button>
        </div>

        {switching && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating listing…
          </span>
        )}
      </div>

      <p className="mt-4 text-lg font-semibold leading-snug text-foreground">
        {displayTitle || titleSource.currentTitle}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Active listing title · saved to catalog
      </p>
    </div>
  );
}
