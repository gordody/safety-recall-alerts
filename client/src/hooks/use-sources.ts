import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type SourcesRefreshInput } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useSources() {
  return useQuery({
    queryKey: [api.sources.list.path],
    queryFn: async () => {
      const res = await fetch(api.sources.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load sources status");
      const json = await res.json();
      return parseWithLogging(api.sources.list.responses[200], json, "sources.list");
    },
  });
}

export function useRefreshSources() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input?: SourcesRefreshInput) => {
      const validated = api.sources.refresh.input.parse(input);
      const res = await fetch(api.sources.refresh.path, {
        method: api.sources.refresh.method,
        headers: { "Content-Type": "application/json" },
        body: validated ? JSON.stringify(validated) : undefined,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to refresh sources");
      const json = await res.json();
      return parseWithLogging(api.sources.refresh.responses[200], json, "sources.refresh");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: [api.sources.list.path] }),
        qc.invalidateQueries({ queryKey: [api.alerts.listRelevant.path] }),
        qc.invalidateQueries({ queryKey: [api.alerts.listAll.path] }),
      ]);
    },
  });
}
