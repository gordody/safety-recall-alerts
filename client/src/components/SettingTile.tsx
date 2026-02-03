import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingTile({
  icon,
  label,
  description,
  right,
  className,
  "data-testid": testId,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  right: ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="
              mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl
              bg-gradient-to-br from-primary/12 via-accent/10 to-transparent
              ring-1 ring-border/50
            "
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight">{label}</p>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="pt-0.5">{right}</div>
      </div>

      <div
        className="
          pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300
          group-hover:opacity-100
        "
        style={{
          background:
            "radial-gradient(800px 260px at 10% 0%, hsl(var(--primary)/0.10), transparent 40%), radial-gradient(800px 260px at 80% 20%, hsl(var(--accent)/0.10), transparent 45%)",
        }}
      />
    </div>
  );
}
