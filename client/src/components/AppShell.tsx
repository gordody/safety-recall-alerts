import React from "react";
import { cn } from "@/lib/utils";

type AppShellVariant = "default" | "light-blue" | "light-green";

export function AppShell({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: AppShellVariant;
}) {
  const variantClass = {
    default: "app-shell-bg",
    "light-blue": "bg-light-blue",
    "light-green": "bg-light-green",
  }[variant];

  return (
    <div className={cn("min-h-dvh grain", variantClass, className)}>
      <div className="relative z-10 mx-auto w-full max-w-[520px] px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}
