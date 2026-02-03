import React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "glass rounded-[1.35rem] p-5 sm:p-6 animate-float-in",
        className,
      )}
    >
      {children}
    </section>
  );
}
