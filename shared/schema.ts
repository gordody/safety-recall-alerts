import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);
export const recallSourceEnum = pgEnum("recall_source", [
  "fda",
  "cdc",
  "foodsafety",
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  useCurrentLocation: boolean("use_current_location").notNull().default(true),
  pushAlertsEnabled: boolean("push_alerts_enabled").notNull().default(true),
  dailyDigestEnabled: boolean("daily_digest_enabled").notNull().default(true),
  dietaryRestrictions: text("dietary_restrictions").array().notNull().default(sql`ARRAY[]::text[]`),
  allergies: text("allergies").array().notNull().default(sql`ARRAY[]::text[]`),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;
export type ProfileResponse = Profile;

export const recallAlerts = pgTable("recall_alerts", {
  id: varchar("id").primaryKey(),
  source: recallSourceEnum("source").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  url: text("url").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  severity: severityEnum("severity").notNull().default("low"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  states: text("states").array().notNull().default(sql`ARRAY[]::text[]`),
  raw: jsonb("raw").notNull().default({}),
});

export const insertRecallAlertSchema = createInsertSchema(recallAlerts);

export type RecallAlert = typeof recallAlerts.$inferSelect;
export type InsertRecallAlert = z.infer<typeof insertRecallAlertSchema>;

export type RecallAlertResponse = RecallAlert;
export type RecallAlertListResponse = RecallAlert[];

export const alertMatchReasons = pgTable("alert_match_reasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(),
  alertId: varchar("alert_id").notNull(),
  matchedState: varchar("matched_state", { length: 2 }),
  matchedAllergens: text("matched_allergens").array().notNull().default(sql`ARRAY[]::text[]`),
  matchedDietaryRestrictions: text("matched_dietary_restrictions").array().notNull().default(sql`ARRAY[]::text[]`),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAlertMatchReasonSchema = createInsertSchema(alertMatchReasons).omit({
  id: true,
  createdAt: true,
});

export type AlertMatchReason = typeof alertMatchReasons.$inferSelect;
export type InsertAlertMatchReason = z.infer<typeof insertAlertMatchReasonSchema>;

export type CreateAlertMatchReasonRequest = InsertAlertMatchReason;
export type AlertMatchReasonResponse = AlertMatchReason;

export const supportedAllergens = [
  "milk",
  "eggs",
  "fish",
  "shellfish",
  "tree nuts",
  "peanuts",
  "wheat",
  "soy",
  "sesame",
] as const;

export const supportedDietaryRestrictions = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "kosher",
  "halal",
] as const;

export const supportedStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
] as const;

export const stateSchema = z.enum(supportedStates);
export const allergenSchema = z.enum(supportedAllergens);
export const dietaryRestrictionSchema = z.enum(supportedDietaryRestrictions);

export const profilePreferencesSchema = z.object({
  displayName: z.string().min(1),
  state: stateSchema,
  useCurrentLocation: z.boolean(),
  pushAlertsEnabled: z.boolean(),
  dailyDigestEnabled: z.boolean(),
  dietaryRestrictions: z.array(dietaryRestrictionSchema),
  allergies: z.array(allergenSchema),
});

export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>;

export type SourceStatusResponse = {
  source: "fda" | "cdc" | "foodsafety";
  lastCheckedAt: string | null;
  lastSuccessfulAt: string | null;
  status: "ok" | "error" | "unknown";
  message?: string;
};

export type DigestPreviewResponse = {
  generatedAt: string;
  profile: ProfileResponse;
  alerts: Array<{
    alert: RecallAlertResponse;
    reasons?: AlertMatchReasonResponse;
  }>;
};
