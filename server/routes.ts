import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  supportedAllergens,
  supportedDietaryRestrictions,
  supportedStates,
} from "@shared/schema";

function zodErrorToResponse(err: z.ZodError) {
  const first = err.errors[0];
  return {
    message: first?.message ?? "Invalid request",
    field: first?.path?.join(".") || undefined,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get(api.meta.supported.path, async (_req, res) => {
    res.json({
      states: supportedStates,
      allergens: supportedAllergens,
      dietaryRestrictions: supportedDietaryRestrictions,
    });
  });

  app.get(api.profile.get.path, async (_req, res) => {
    const profile = await storage.getProfile();
    res.json(profile);
  });

  app.put(api.profile.upsert.path, async (req, res) => {
    try {
      const input = api.profile.upsert.input.parse(req.body);
      const saved = await storage.upsertProfile(input as any);
      res.json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(zodErrorToResponse(err));
      }
      throw err;
    }
  });

  app.get(api.alerts.listAll.path, async (req, res) => {
    const parsed = api.alerts.listAll.input?.safeParse(req.query);
    const q = parsed?.success ? parsed.data : undefined;

    const alerts = await storage.listAlerts({
      source: q?.source as any,
      state: q?.state,
      q: q?.q,
      limit: q?.limit,
      offset: q?.offset,
    });

    res.json(alerts);
  });

  app.get(api.alerts.listRelevant.path, async (req, res) => {
    const parsed = api.alerts.listRelevant.input?.safeParse(req.query);
    const q = parsed?.success ? parsed.data : undefined;

    const profile = await storage.getProfile();

    const state = q?.state ?? profile?.state;
    const allergies = q?.allergies ?? profile?.allergies ?? [];
    const dietaryRestrictions =
      q?.dietaryRestrictions ?? profile?.dietaryRestrictions ?? [];

    const items = await storage.listRelevantAlerts({
      state: state ?? undefined,
      allergies,
      dietaryRestrictions,
      limit: q?.limit,
    });

    res.json(items);
  });

  app.get(api.sources.list.path, async (_req, res) => {
    const statuses = await storage.getSourceStatuses();
    res.json(
      statuses.map((s) => ({
        ...s,
        lastCheckedAt: s.lastCheckedAt ? s.lastCheckedAt.toISOString() : null,
        lastSuccessfulAt: s.lastSuccessfulAt
          ? s.lastSuccessfulAt.toISOString()
          : null,
      })),
    );
  });

  app.post(api.sources.refresh.path, async (req, res) => {
    const parsed = api.sources.refresh.input?.safeParse(req.body);
    const input = parsed?.success ? parsed.data : undefined;

    const result = await storage.refreshSources({
      source: input?.source as any,
    });

    res.json(result);
  });

  return httpServer;
}
