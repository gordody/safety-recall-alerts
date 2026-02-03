import { z } from "zod";
import {
  allergenSchema,
  dietaryRestrictionSchema,
  insertProfileSchema,
  recallAlerts,
  stateSchema,
  supportedAllergens,
  supportedDietaryRestrictions,
  supportedStates,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profile: {
    get: {
      method: "GET" as const,
      path: "/api/profile",
      responses: {
        200: z
          .object({
            id: z.string(),
            displayName: z.string(),
            state: stateSchema,
            useCurrentLocation: z.boolean(),
            pushAlertsEnabled: z.boolean(),
            dailyDigestEnabled: z.boolean(),
            dietaryRestrictions: z.array(dietaryRestrictionSchema),
            allergies: z.array(allergenSchema),
          })
          .nullable(),
      },
    },
    upsert: {
      method: "PUT" as const,
      path: "/api/profile",
      input: insertProfileSchema
        .extend({
          state: stateSchema,
          dietaryRestrictions: z.array(dietaryRestrictionSchema),
          allergies: z.array(allergenSchema),
        })
        .omit({ id: true }),
      responses: {
        200: z.object({
          id: z.string(),
          displayName: z.string(),
          state: stateSchema,
          useCurrentLocation: z.boolean(),
          pushAlertsEnabled: z.boolean(),
          dailyDigestEnabled: z.boolean(),
          dietaryRestrictions: z.array(dietaryRestrictionSchema),
          allergies: z.array(allergenSchema),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  alerts: {
    listRelevant: {
      method: "GET" as const,
      path: "/api/alerts/relevant",
      input: z
        .object({
          state: stateSchema.optional(),
          allergies: z.array(allergenSchema).optional(),
          dietaryRestrictions: z.array(dietaryRestrictionSchema).optional(),
          limit: z.coerce.number().int().min(1).max(100).optional(),
        })
        .optional(),
      responses: {
        200: z.array(
          z.object({
            alert: z.custom<typeof recallAlerts.$inferSelect>(),
            reasons: z
              .object({
                matchedState: stateSchema.nullable(),
                matchedAllergens: z.array(allergenSchema),
                matchedDietaryRestrictions: z.array(dietaryRestrictionSchema),
                score: z.number().int(),
              })
              .optional(),
          }),
        ),
      },
    },
    listAll: {
      method: "GET" as const,
      path: "/api/alerts",
      input: z
        .object({
          source: z.enum(["fda", "cdc", "foodsafety"]).optional(),
          state: stateSchema.optional(),
          q: z.string().optional(),
          limit: z.coerce.number().int().min(1).max(200).optional(),
          offset: z.coerce.number().int().min(0).optional(),
        })
        .optional(),
      responses: {
        200: z.array(z.custom<typeof recallAlerts.$inferSelect>()),
      },
    },
  },
  sources: {
    list: {
      method: "GET" as const,
      path: "/api/sources",
      responses: {
        200: z.array(
          z.object({
            source: z.enum(["fda", "cdc", "foodsafety"]),
            lastCheckedAt: z.string().nullable(),
            lastSuccessfulAt: z.string().nullable(),
            status: z.enum(["ok", "error", "unknown"]),
            message: z.string().optional(),
          }),
        ),
      },
    },
    refresh: {
      method: "POST" as const,
      path: "/api/sources/refresh",
      input: z
        .object({
          source: z.enum(["fda", "cdc", "foodsafety"]).optional(),
        })
        .optional(),
      responses: {
        200: z.object({
          refreshed: z.array(z.enum(["fda", "cdc", "foodsafety"])),
          inserted: z.number().int(),
          updated: z.number().int(),
        }),
      },
    },
  },
  meta: {
    supported: {
      method: "GET" as const,
      path: "/api/meta/supported",
      responses: {
        200: z.object({
          states: z.array(z.enum(supportedStates)),
          allergens: z.array(z.enum(supportedAllergens)),
          dietaryRestrictions: z.array(z.enum(supportedDietaryRestrictions)),
        }),
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type ProfileGetResponse = z.infer<typeof api.profile.get.responses[200]>;
export type ProfileUpsertInput = z.infer<typeof api.profile.upsert.input>;
export type ProfileUpsertResponse = z.infer<typeof api.profile.upsert.responses[200]>;

export type RelevantAlertsQuery = z.infer<typeof api.alerts.listRelevant.input>;
export type RelevantAlertsResponse = z.infer<
  typeof api.alerts.listRelevant.responses[200]
>;

export type AlertsListQuery = z.infer<typeof api.alerts.listAll.input>;
export type AlertsListResponse = z.infer<typeof api.alerts.listAll.responses[200]>;

export type SourcesListResponse = z.infer<typeof api.sources.list.responses[200]>;
export type SourcesRefreshInput = z.infer<typeof api.sources.refresh.input>;
export type SourcesRefreshResponse = z.infer<typeof api.sources.refresh.responses[200]>;

export type SupportedMetaResponse = z.infer<typeof api.meta.supported.responses[200]>;
