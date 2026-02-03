import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useSupportedMeta() {
  return useQuery({
    queryKey: [api.meta.supported.path],
    queryFn: async () => {
      const res = await fetch(api.meta.supported.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load supported meta");
      const json = await res.json();
      return parseWithLogging(api.meta.supported.responses[200], json, "meta.supported");
    },
  });
}
