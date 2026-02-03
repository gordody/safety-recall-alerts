import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SourceRow({
  title,
  subtitle = "Updated daily",
  href,
  status,
  timestamps,
  "data-testid": testId,
}: {
  title: string;
  subtitle?: string;
  href: string;
  status?: "ok" | "error" | "unknown";
  timestamps?: { lastCheckedAt?: string | null; lastSuccessfulAt?: string | null; message?: string };
  "data-testid"?: string;
}) {
  const statusChip =
    status === "ok"
      ? "bg-[hsl(156_74%_40%/0.14)] text-[hsl(156_74%_28%)] border-[hsl(156_74%_40%/0.22)] dark:text-[hsl(156_74%_62%)]"
      : status === "error"
        ? "bg-destructive/12 text-destructive border-destructive/20"
        : "bg-muted text-muted-foreground border-border/60";

  const statusLabel = status ? status.toUpperCase() : "—";

  function open() {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={open}
      className={cn(
        "group w-full text-left",
        "rounded-2xl border border-border/60 bg-card/75 px-4 py-4 shadow-sm backdrop-blur",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-card",
        "focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/40",
        "active:translate-y-0 active:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-tight">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

          {(timestamps?.lastCheckedAt || timestamps?.lastSuccessfulAt || timestamps?.message) && (
            <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {timestamps?.lastCheckedAt ? (
                <p>Checked: {new Date(timestamps.lastCheckedAt).toLocaleString()}</p>
              ) : null}
              {timestamps?.lastSuccessfulAt ? (
                <p>Success: {new Date(timestamps.lastSuccessfulAt).toLocaleString()}</p>
              ) : null}
              {timestamps?.message ? <p className="line-clamp-1">{timestamps.message}</p> : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold", statusChip)}>
            {statusLabel}
          </span>
          <ChevronRight className="h-5 w-5 text-foreground/35 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}
