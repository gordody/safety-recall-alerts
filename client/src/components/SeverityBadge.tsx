import { cn } from "@/lib/utils";

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const styles =
    severity === "high"
      ? "bg-destructive/12 text-destructive border-destructive/20"
      : severity === "medium"
        ? "bg-[hsl(32_92%_52%/0.14)] text-[hsl(24_92%_34%)] border-[hsl(32_92%_52%/0.22)] dark:text-[hsl(32_92%_64%)]"
        : "bg-[hsl(156_74%_40%/0.14)] text-[hsl(156_74%_28%)] border-[hsl(156_74%_40%/0.22)] dark:text-[hsl(156_74%_62%)]";

  const label = severity[0].toUpperCase() + severity.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-tight",
        styles,
      )}
    >
      {label}
    </span>
  );
}
