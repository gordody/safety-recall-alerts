import { db } from "./db";
import {
  alertMatchReasons,
  profiles,
  recallAlerts,
  type AlertMatchReasonResponse,
  type CreateProfileRequest,
  type ProfileResponse,
  type RecallAlertResponse,
  type SourcesRefreshResponse,
  type UpdateProfileRequest,
} from "@shared/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

export type SourceKey = "fda" | "cdc" | "foodsafety";

type SourceStatus = {
  source: SourceKey;
  lastCheckedAt: Date | null;
  lastSuccessfulAt: Date | null;
  status: "ok" | "error" | "unknown";
  message?: string;
};

export interface RelevantAlertItem {
  alert: RecallAlertResponse;
  reasons?: {
    matchedState: string | null;
    matchedAllergens: string[];
    matchedDietaryRestrictions: string[];
    score: number;
  };
}

export interface IStorage {
  getProfile(): Promise<ProfileResponse | null>;
  upsertProfile(input: CreateProfileRequest): Promise<ProfileResponse>;
  updateProfile(updates: UpdateProfileRequest): Promise<ProfileResponse>;

  listAlerts(params?: {
    source?: SourceKey;
    state?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<RecallAlertResponse[]>;

  listRelevantAlerts(params: {
    state?: string;
    allergies?: string[];
    dietaryRestrictions?: string[];
    limit?: number;
  }): Promise<RelevantAlertItem[]>;

  getSourceStatuses(): Promise<SourceStatus[]>;

  refreshSources(params?: {
    source?: SourceKey;
  }): Promise<SourcesRefreshResponse>;
}

function normalizeTokens(values: string[] | undefined): string[] {
  return (values ?? [])
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 50);
}

function computeSeverity(alert: {
  title: string;
  summary: string;
  tags: string[];
}): "low" | "medium" | "high" {
  const text = `${alert.title} ${alert.summary} ${(alert.tags ?? []).join(" ")}`.toLowerCase();
  if (
    text.includes("listeria") ||
    text.includes("salmonella") ||
    text.includes("e. coli") ||
    text.includes("escherichia coli") ||
    text.includes("botul") ||
    text.includes("death") ||
    text.includes("hospital")
  ) {
    return "high";
  }
  if (
    text.includes("allergen") ||
    text.includes("undeclared") ||
    text.includes("pathogen") ||
    text.includes("contamination")
  ) {
    return "medium";
  }
  return "low";
}

function tokenizeMatchText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function computeMatchReasons(params: {
  state?: string;
  allergies?: string[];
  dietaryRestrictions?: string[];
  alert: RecallAlertResponse;
}): RelevantAlertItem["reasons"] {
  const state = params.state?.toUpperCase();
  const allergies = normalizeTokens(params.allergies);
  const dietary = normalizeTokens(params.dietaryRestrictions);

  const tokens = new Set(tokenizeMatchText(`${params.alert.title} ${params.alert.summary} ${(params.alert.tags ?? []).join(" ")}`));

  const matchedAllergens = allergies.filter((a) => tokens.has(a.replace(/\s+/g, " ")) || tokens.has(a.split(" ")[0] ?? a));
  const matchedDietaryRestrictions = dietary.filter((d) => tokens.has(d.replace(/\s+/g, " ")) || tokens.has(d.split("-")[0] ?? d));

  const states = (params.alert.states ?? []).map((s) => s.toUpperCase());
  const matchedState = state && states.length > 0 ? (states.includes(state) ? state : null) : null;

  let score = 0;
  if (matchedState) score += 10;
  score += matchedAllergens.length * 6;
  score += matchedDietaryRestrictions.length * 2;

  if (params.alert.severity === "high") score += 4;
  if (params.alert.severity === "medium") score += 2;

  if (score <= 0) return undefined;
  return {
    matchedState,
    matchedAllergens,
    matchedDietaryRestrictions,
    score,
  };
}

export class DatabaseStorage implements IStorage {
  async getProfile(): Promise<ProfileResponse | null> {
    const [profile] = await db.select().from(profiles).limit(1);
    return profile ?? null;
  }

  async upsertProfile(input: CreateProfileRequest): Promise<ProfileResponse> {
    const existing = await this.getProfile();
    if (!existing) {
      const [created] = await db.insert(profiles).values(input).returning();
      return created;
    }
    const [updated] = await db
      .update(profiles)
      .set(input)
      .where(eq(profiles.id, existing.id))
      .returning();
    return updated;
  }

  async updateProfile(updates: UpdateProfileRequest): Promise<ProfileResponse> {
    const existing = await this.getProfile();
    if (!existing) {
      const [created] = await db.insert(profiles).values({
        displayName: updates.displayName ?? "You",
        state: (updates.state ?? "CA") as any,
        useCurrentLocation: updates.useCurrentLocation ?? true,
        pushAlertsEnabled: updates.pushAlertsEnabled ?? true,
        dailyDigestEnabled: updates.dailyDigestEnabled ?? true,
        dietaryRestrictions: (updates.dietaryRestrictions ?? []) as any,
        allergies: (updates.allergies ?? []) as any,
      }).returning();
      return created;
    }

    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, existing.id))
      .returning();
    return updated;
  }

  async listAlerts(params?: {
    source?: SourceKey;
    state?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<RecallAlertResponse[]> {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
    const offset = Math.max(params?.offset ?? 0, 0);

    const filters: any[] = [];

    if (params?.source) {
      filters.push(eq(recallAlerts.source, params.source));
    }

    if (params?.state) {
      filters.push(sql`${params.state.toUpperCase()} = ANY(${recallAlerts.states})`);
    }

    if (params?.q) {
      const q = `%${params.q}%`;
      filters.push(or(ilike(recallAlerts.title, q), ilike(recallAlerts.summary, q)));
    }

    const where = filters.length ? and(...filters) : undefined;

    return await db
      .select()
      .from(recallAlerts)
      .where(where)
      .orderBy(desc(recallAlerts.updatedAt), desc(recallAlerts.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async listRelevantAlerts(params: {
    state?: string;
    allergies?: string[];
    dietaryRestrictions?: string[];
    limit?: number;
  }): Promise<RelevantAlertItem[]> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const state = params.state?.toUpperCase();

    const candidates = await db
      .select()
      .from(recallAlerts)
      .orderBy(desc(recallAlerts.updatedAt), desc(recallAlerts.publishedAt))
      .limit(200);

    const items: RelevantAlertItem[] = [];

    for (const alert of candidates) {
      const reasons = computeMatchReasons({
        state,
        allergies: params.allergies,
        dietaryRestrictions: params.dietaryRestrictions,
        alert,
      });

      const hasStateConstraint = (alert.states ?? []).length > 0;
      const stateOk = !hasStateConstraint || (state ? (alert.states ?? []).map((s) => s.toUpperCase()).includes(state) : true);

      if (!stateOk) continue;

      const score = reasons?.score ?? 0;
      const allergiesMatched = (reasons?.matchedAllergens ?? []).length > 0;
      const dietaryMatched = (reasons?.matchedDietaryRestrictions ?? []).length > 0;

      if (hasStateConstraint || allergiesMatched || dietaryMatched) {
        items.push({
          alert,
          reasons,
        });
      } else if (score > 0) {
        items.push({ alert, reasons });
      }

      if (items.length >= limit) break;
    }

    return items;
  }

  async getSourceStatuses(): Promise<SourceStatus[]> {
    return [
      {
        source: "fda",
        lastCheckedAt: null,
        lastSuccessfulAt: null,
        status: "unknown",
      },
      {
        source: "cdc",
        lastCheckedAt: null,
        lastSuccessfulAt: null,
        status: "unknown",
      },
      {
        source: "foodsafety",
        lastCheckedAt: null,
        lastSuccessfulAt: null,
        status: "unknown",
      },
    ];
  }

  async refreshSources(params?: {
    source?: SourceKey;
  }): Promise<SourcesRefreshResponse> {
    const sources: SourceKey[] = params?.source
      ? [params.source]
      : ["fda", "cdc", "foodsafety"];

    const now = new Date();

    const seedItems: Array<Omit<RecallAlertResponse, "raw"> & { raw: any }> = [
      {
        id: "demo-fda-rtcs-2026-02-03",
        source: "fda",
        title: "Ready-to-eat chicken salad recalled for possible Listeria contamination",
        summary:
          "Sold under multiple labels. Check lot codes and discard or return for refund. May have been distributed to select states.",
        url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
        publishedAt: now,
        updatedAt: now,
        severity: "high",
        tags: ["listeria", "ready-to-eat", "chicken", "salad"],
        states: ["CA", "NV", "AZ"],
        raw: { kind: "prototype", source: "fda" },
      },
      {
        id: "demo-foodsafety-sesame-2026-02-03",
        source: "foodsafety",
        title: "Snack mix recalled due to undeclared sesame",
        summary:
          "People with sesame allergy may be at risk. Product sold through retailers and online.",
        url: "https://www.foodsafety.gov/recalls-and-outbreaks",
        publishedAt: now,
        updatedAt: now,
        severity: "medium",
        tags: ["allergen", "undeclared", "sesame", "snack"],
        states: ["CA", "OR", "WA"],
        raw: { kind: "prototype", source: "foodsafety" },
      },
      {
        id: "demo-cdc-outbreak-2026-02-03",
        source: "cdc",
        title: "CDC investigation: Salmonella infections linked to cucumbers",
        summary:
          "Check if cucumbers in your area may be affected. Follow CDC guidance and retailer notices.",
        url: "https://www.cdc.gov/food-safety/",
        publishedAt: now,
        updatedAt: now,
        severity: "high",
        tags: ["salmonella", "outbreak", "cucumber"],
        states: [],
        raw: { kind: "prototype", source: "cdc" },
      },
      {
        id: "demo-fda-milk-2026-02-03",
        source: "fda",
        title: "Cookie dough recalled due to undeclared milk",
        summary:
          "Undeclared milk allergen may cause serious or life-threatening reactions in sensitive individuals.",
        url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
        publishedAt: now,
        updatedAt: now,
        severity: "medium",
        tags: ["allergen", "undeclared", "milk", "cookie"],
        states: ["TX", "CA", "NY"],
        raw: { kind: "prototype", source: "fda" },
      },
    ];

    let inserted = 0;
    let updated = 0;

    for (const item of seedItems) {
      if (!sources.includes(item.source as SourceKey)) continue;

      const [existing] = await db
        .select()
        .from(recallAlerts)
        .where(eq(recallAlerts.id, item.id))
        .limit(1);

      if (!existing) {
        const severity = computeSeverity(item);
        await db.insert(recallAlerts).values({
          ...item,
          severity,
        });
        inserted += 1;
      } else {
        const severity = computeSeverity(item);
        await db
          .update(recallAlerts)
          .set({
            title: item.title,
            summary: item.summary,
            url: item.url,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            tags: item.tags,
            states: item.states,
            source: item.source as any,
            severity,
            raw: item.raw,
          })
          .where(eq(recallAlerts.id, item.id));
        updated += 1;
      }
    }

    return {
      refreshed: sources,
      inserted,
      updated,
    };
  }
}

export const storage = new DatabaseStorage();
