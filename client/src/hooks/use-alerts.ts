import { useQuery } from "@tanstack/react-query";
import { api, type AlertsListQuery, type RelevantAlertsQuery } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

function buildQuery(params?: Record<string, unknown>) {
  const sp = new URLSearchParams();
  if (!params) return "";
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)));
    else sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function useRelevantAlerts(input?: RelevantAlertsQuery) {
  return useQuery({
    queryKey: [api.alerts.listRelevant.path, input ?? {}],
    queryFn: async () => {
      const validated = api.alerts.listRelevant.input.parse(input);
      const res = await fetch(`${api.alerts.listRelevant.path}${buildQuery(validated as any)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load relevant alerts");
      const json = await res.json();
      return parseWithLogging(api.alerts.listRelevant.responses[200], json, "alerts.listRelevant");
    },
  });
}

export function useAllAlerts(input?: AlertsListQuery) {
  return useQuery({
    queryKey: [api.alerts.listAll.path, input ?? {}],
    queryFn: async () => {
      const validated = api.alerts.listAll.input.parse(input);
      const res = await fetch(`${api.alerts.listAll.path}${buildQuery(validated as any)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load alerts");
      const json = await res.json();
      return parseWithLogging(api.alerts.listAll.responses[200], json, "alerts.listAll");
    },
  });
}
