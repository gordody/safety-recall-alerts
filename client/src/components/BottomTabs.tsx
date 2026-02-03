import { Link, useLocation } from "wouter";
import { BellRing, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/alerts", label: "Alerts", icon: BellRing, testId: "tab-alerts" },
  { href: "/profile", label: "Profile", icon: User2, testId: "tab-profile" },
] as const;

export function BottomTabs() {
  const [loc] = useLocation();

  return (
    <nav
      className="
        safe-bottom fixed bottom-0 left-0 right-0 z-50
        border-t border-border/60 bg-background/70 backdrop-blur-xl
      "
      role="navigation"
      aria-label="Bottom tabs"
    >
      <div className="mx-auto w-full max-w-[520px] px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 py-2">
          {tabs.map((t) => {
            const active = loc === t.href || (t.href === "/alerts" && loc === "/");
            const Icon = t.icon;

            return (
              <Link
                key={t.href}
                href={t.href}
                data-testid={t.testId}
                className={cn(
                  "group relative flex flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-300",
                  active
                    ? "bg-card shadow-sm border border-border/60"
                    : "hover:bg-card/70 hover:shadow-sm border border-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-primary" : "text-foreground/65 group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "mt-1 text-xs font-semibold",
                    active ? "text-foreground" : "text-foreground/70",
                  )}
                >
                  {t.label}
                </span>

                {active && (
                  <span
                    className="
                      pointer-events-none absolute -top-0.5 left-1/2 h-1 w-10 -translate-x-1/2
                      rounded-full bg-gradient-to-r from-primary/70 via-accent/60 to-primary/70
                      shadow-[0_8px_20px_hsl(var(--primary)/0.25)]
                    "
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
