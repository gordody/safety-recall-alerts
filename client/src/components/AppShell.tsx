import React from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-dvh app-shell-bg grain", className)}>
      <div className="relative z-10 mx-auto w-full max-w-[520px] px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}
