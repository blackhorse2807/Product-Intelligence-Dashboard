import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children, className }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, onClose, className }) {
  return (
    <div
      className={cn(
        "relative border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-5",
        className
      )}
    >
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  );
}

export function DialogBody({ children, className }) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)}>{children}</div>
  );
}

export function DialogFooter({ children, className }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}
