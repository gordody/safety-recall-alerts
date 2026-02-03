import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePill } from "@/components/SourcePill";

type Alert = {
  id: string;
  source: "fda" | "cdc" | "foodsafety";
  title: string;
  summary: string;
  url: string;
  publishedAt: string | Date;
  updatedAt: string | Date;
  severity: "low" | "medium" | "high";
  tags: string[];
  states: string[];
};

function toDate(d: string | Date) {
  return d instanceof Date ? d : new Date(d);
}

function isToday(d: Date) {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function relativeDayLabel(d: Date) {
  if (isToday(d)) return "Updated today";
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 1) return "Updated yesterday";
  if (diff < 7) return `Updated ${diff} days ago`;
  return `Updated ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function AlertCard({
  alert,
  reasonsSummary,
  className,
  "data-testid": testId,
}: {
  alert: Alert;
  reasonsSummary?: string;
  className?: string;
  "data-testid"?: string;
}) {
  const updated = toDate(alert.updatedAt);

  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative overflow-hidden rounded-[1.35rem] border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(900px 260px at 20% 0%, hsl(var(--primary)/0.10), transparent 45%), radial-gradient(900px 260px at 100% 15%, hsl(var(--accent)/0.10), transparent 48%)",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground">
              {relativeDayLabel(updated)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base leading-tight font-extrabold tracking-tight">
              {alert.title}
            </h3>
          </div>

          <button
            type="button"
            data-testid={`${testId}-open`}
            onClick={() => window.open(alert.url, "_blank", "noopener,noreferrer")}
            className="
              inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
              border border-border/60 bg-background/60 shadow-sm
              transition-all duration-300 ease-out
              hover:bg-background hover:shadow-md hover:-translate-y-0.5
              focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/40
              active:translate-y-0 active:shadow-sm
            "
            aria-label="Open alert source"
          >
            <ExternalLink className="h-4.5 w-4.5 text-foreground/75" />
          </button>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">
          {alert.summary}
        </p>

        {reasonsSummary ? (
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            {reasonsSummary}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourcePill source={alert.source} />
          <SeverityBadge severity={alert.severity} />
          {alert.states?.length ? (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-bold text-foreground/70">
              {alert.states.length === 1 ? alert.states[0] : `${alert.states.length} states`}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-bold text-foreground/70">
              Nationwide
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
