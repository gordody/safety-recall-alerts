import { cn } from "@/lib/utils";

export function SourcePill({ source }: { source: "fda" | "cdc" | "foodsafety" }) {
  const label =
    source === "foodsafety" ? "FoodSafety.gov" : source.toUpperCase();

  const styles =
    source === "fda"
      ? "bg-primary/10 text-primary border-primary/20"
      : source === "cdc"
        ? "bg-[hsl(280_86%_56%/0.12)] text-[hsl(280_86%_44%)] border-[hsl(280_86%_56%/0.20)] dark:text-[hsl(280_86%_72%)]"
        : "bg-[hsl(188_88%_38%/0.12)] text-[hsl(188_88%_28%)] border-[hsl(188_88%_38%/0.20)] dark:text-[hsl(188_88%_70%)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-tight",
        styles,
      )}
    >
      {label}
    </span>
  );
}
