import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ProfileUpsertInput } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useProfile() {
  return useQuery({
    queryKey: [api.profile.get.path],
    queryFn: async () => {
      const res = await fetch(api.profile.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      return parseWithLogging(api.profile.get.responses[200], json, "profile.get");
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpsertInput) => {
      const validated = api.profile.upsert.input.parse(input);
      const res = await fetch(api.profile.upsert.path, {
        method: api.profile.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errJson = await res.json().catch(() => ({}));
          const parsed = parseWithLogging(api.profile.upsert.responses[400], errJson, "profile.upsert.400");
          throw new Error(parsed.message);
        }
        throw new Error("Failed to save profile");
      }

      const json = await res.json();
      return parseWithLogging(api.profile.upsert.responses[200], json, "profile.upsert");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: [api.profile.get.path] }),
        qc.invalidateQueries({ queryKey: [api.alerts.listRelevant.path] }),
      ]);
    },
  });
}
