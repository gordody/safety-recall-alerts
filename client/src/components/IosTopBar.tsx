import { Link } from "wouter";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function IosTopBar({
  title = "Recall Guard",
  subtitle = "Personalized food recall alerts",
  rightHref = "/profile",
  rightLabel = "Settings",
  className,
}: {
  title?: string;
  subtitle?: string;
  rightHref?: string;
  rightLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("safe-top pt-6 pb-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wide text-muted-foreground">
            {subtitle}
          </p>
          <h1 className="mt-1 text-3xl leading-none">{title}</h1>
        </div>

        <Link
          href={rightHref}
          aria-label={rightLabel}
          data-testid="nav-settings"
          className="
            group inline-flex h-11 w-11 items-center justify-center rounded-2xl
            border border-border/70 bg-card/70 shadow-sm backdrop-blur
            transition-all duration-300 ease-out
            hover:-translate-y-0.5 hover:shadow-md hover:bg-card
            focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/40
            active:translate-y-0 active:shadow-sm
          "
        >
          <Settings className="h-5 w-5 text-foreground/80 transition-colors group-hover:text-foreground" />
        </Link>
      </div>
    </header>
  );
}
