import { useMemo } from "react";
import { Link } from "wouter";
import { BellRing, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IosTopBar } from "@/components/IosTopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { GlassCard } from "@/components/GlassCard";
import { SettingTile } from "@/components/SettingTile";
import { AlertCard } from "@/components/AlertCard";
import { SourceRow } from "@/components/SourceRow";
import { Seo } from "@/components/Seo";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { useProfile, useUpsertProfile } from "@/hooks/use-profile";
import { useSupportedMeta } from "@/hooks/use-meta";
import { useRelevantAlerts } from "@/hooks/use-alerts";
import { useRefreshSources, useSources } from "@/hooks/use-sources";

export default function AlertsPage() {
  const { toast } = useToast();
  const profileQ = useProfile();
  const metaQ = useSupportedMeta();
  const sourcesQ = useSources();

  const refreshM = useRefreshSources();
  const upsertM = useUpsertProfile();

  const profile = profileQ.data ?? null;
  const state = profile?.state;

  const relevantQ = useRelevantAlerts(
    profile
      ? {
          state: profile.state,
          allergies: profile.allergies,
          dietaryRestrictions: profile.dietaryRestrictions,
          limit: 30,
        }
      : { limit: 30 },
  );

  const sourcesByKey = useMemo(() => {
    const list = sourcesQ.data ?? [];
    const m = new Map<string, (typeof list)[number]>();
    list.forEach((s) => m.set(s.source, s));
    return m;
  }, [sourcesQ.data]);

  async function toggleUseCurrentLocation(next: boolean) {
    if (!profile) {
      toast({
        title: "Set up your profile first",
        description: "Tap Profile to choose your state and preferences.",
      });
      return;
    }
    upsertM.mutate(
      {
        ...profile,
        useCurrentLocation: next,
      },
      {
        onError: (e) =>
          toast({
            title: "Couldn't update",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          }),
      },
    );
  }

  async function toggleDailyDigest(next: boolean) {
    if (!profile) {
      toast({ title: "Set up your profile first", description: "Tap Profile to continue." });
      return;
    }
    upsertM.mutate(
      { ...profile, dailyDigestEnabled: next },
      {
        onError: (e) =>
          toast({
            title: "Couldn't update",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          }),
      },
    );
  }

  async function togglePushAlerts(next: boolean) {
    if (!profile) {
      toast({ title: "Set up your profile first", description: "Tap Profile to continue." });
      return;
    }
    upsertM.mutate(
      { ...profile, pushAlertsEnabled: next },
      {
        onError: (e) =>
          toast({
            title: "Couldn't update",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          }),
      },
    );
  }

  async function changeState(nextState: string) {
    if (!profile) {
      toast({ title: "Set up your profile first", description: "Tap Profile to continue." });
      return;
    }
    upsertM.mutate(
      { ...profile, state: nextState as any },
      {
        onError: (e) =>
          toast({
            title: "Couldn't update state",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          }),
      },
    );
  }

  async function refreshNow() {
    refreshM.mutate(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Refreshed",
          description: `Inserted ${data.inserted} • Updated ${data.updated} • Sources: ${data.refreshed.join(", ").toUpperCase()}`,
        });
      },
      onError: (e) => {
        toast({
          title: "Refresh failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      },
    });
  }

  const states = metaQ.data?.states ?? [];

  return (
    <AppShell>
      <Seo
        title="Recall Guard — Alerts"
        description="Personalized food recall alerts matched to your location, allergies, and dietary restrictions."
      />

      <IosTopBar />

      <main className="pb-24">
        <div className="animate-float-in">
          <div
            className="
              mb-4 rounded-[1.35rem] border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur
            "
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/14 via-accent/12 to-transparent ring-1 ring-border/60">
                  <MapPin className="h-5 w-5 text-foreground/75" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold tracking-tight">Using current location</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    State-level matching (prototype)
                  </p>
                </div>
              </div>

              <Switch
                data-testid="toggle-use-current-location"
                checked={!!profile?.useCurrentLocation}
                onCheckedChange={toggleUseCurrentLocation}
              />
            </div>
          </div>

          <GlassCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl leading-tight">Food Alerts and more</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Daily personalized alerts for your location + allergies.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SettingTile
                data-testid="tile-daily-digest"
                icon={<BellRing className="h-5 w-5 text-primary" />}
                label="Daily digest"
                description="A gentle once-a-day summary."
                right={
                  <Switch
                    data-testid="toggle-daily-digest"
                    checked={!!profile?.dailyDigestEnabled}
                    onCheckedChange={toggleDailyDigest}
                  />
                }
              />
              <SettingTile
                data-testid="tile-push-alerts"
                icon={<BellRing className="h-5 w-5 text-[hsl(var(--accent))]" />}
                label="Push alerts"
                description="Instant nudges for high-risk matches."
                right={
                  <Switch
                    data-testid="toggle-push-alerts"
                    checked={!!profile?.pushAlertsEnabled}
                    onCheckedChange={togglePushAlerts}
                  />
                }
              />
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-sm font-extrabold tracking-tight">Location (state)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We're using state-level matching for now.
                </p>
              </div>

              <div className="w-full sm:w-[240px]">
                {metaQ.isLoading || profileQ.isLoading ? (
                  <Skeleton className="h-11 w-full rounded-2xl" />
                ) : (
                  <Select
                    disabled={!!profile?.useCurrentLocation || !profile}
                    value={state ?? undefined}
                    onValueChange={changeState}
                  >
                    <SelectTrigger
                      data-testid="select-state"
                      className="
                        h-11 rounded-2xl bg-background/60 shadow-sm backdrop-blur
                        border-border/70 focus:ring-4 focus:ring-primary/15 focus:border-primary/40
                      "
                    >
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {profile?.useCurrentLocation ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Locked while “Using current location” is on.
                  </p>
                ) : null}

                {!profile ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    No profile yet —{" "}
                    <Link href="/profile" className="font-bold text-primary hover:underline" data-testid="link-go-profile">
                      set it up
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                data-testid="btn-refresh-now"
                onClick={refreshNow}
                disabled={refreshM.isPending}
                className="
                  h-11 rounded-2xl
                  bg-gradient-to-r from-primary to-primary/80
                  text-primary-foreground shadow-lg shadow-primary/20
                  hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-md
                  transition-all duration-200 ease-out
                "
              >
                <RefreshCw className={refreshM.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                {refreshM.isPending ? "Refreshing…" : "Refresh now"}
              </Button>

              <Button
                data-testid="btn-open-profile"
                variant="secondary"
                onClick={() => (window.location.href = "/profile")}
                className="
                  h-11 rounded-2xl
                  bg-card/70 shadow-sm backdrop-blur
                  hover:bg-card hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-sm
                  transition-all duration-200
                "
              >
                Edit preferences
              </Button>
            </div>
          </GlassCard>
        </div>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl">Relevant alerts</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Matches your location + selected allergies.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {relevantQ.isLoading ? (
              <>
                <div className="shimmer rounded-[1.35rem] border border-border/60 bg-card/70 p-4 shadow-sm">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-6 w-4/5" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-11/12" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                </div>
                <div className="shimmer rounded-[1.35rem] border border-border/60 bg-card/70 p-4 shadow-sm">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="mt-2 h-6 w-3/4" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-10/12" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                </div>
              </>
            ) : relevantQ.isError ? (
              <div className="rounded-[1.35rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load alerts:{" "}
                {relevantQ.error instanceof Error ? relevantQ.error.message : "Unknown error"}
              </div>
            ) : (relevantQ.data?.length ?? 0) === 0 ? (
              <div className="rounded-[1.35rem] border border-border/60 bg-card/75 p-5 shadow-sm backdrop-blur">
                <p className="text-sm font-extrabold tracking-tight">All clear — for now.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adding allergies or dietary restrictions in Profile, or tap “Refresh now” to
                  simulate today’s check.
                </p>
              </div>
            ) : (
              relevantQ.data!.map((item, idx) => {
                const reasons = item.reasons;
                const bits: string[] = [];
                if (reasons?.matchedState) bits.push(`Matched ${reasons.matchedState}`);
                if (reasons?.matchedAllergens?.length) bits.push(`Allergens: ${reasons.matchedAllergens.join(", ")}`);
                if (reasons?.matchedDietaryRestrictions?.length) bits.push(`Diet: ${reasons.matchedDietaryRestrictions.join(", ")}`);
                const summary = bits.length ? `${bits.join(" • ")} • Score ${reasons?.score ?? 0}` : undefined;

                return (
                  <AlertCard
                    key={item.alert.id}
                    data-testid={`alert-card-${idx}`}
                    alert={item.alert as any}
                    reasonsSummary={summary}
                  />
                );
              })
            )}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl">Sources</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                What we check daily (prototype).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <SourceRow
              data-testid="source-fda"
              title="FDA recalls & alerts"
              href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
              status={sourcesByKey.get("fda")?.status}
              timestamps={{
                lastCheckedAt: sourcesByKey.get("fda")?.lastCheckedAt,
                lastSuccessfulAt: sourcesByKey.get("fda")?.lastSuccessfulAt,
                message: sourcesByKey.get("fda")?.message,
              }}
            />
            <SourceRow
              data-testid="source-cdc"
              title="CDC food safety"
              href="https://www.cdc.gov/food-safety/"
              status={sourcesByKey.get("cdc")?.status}
              timestamps={{
                lastCheckedAt: sourcesByKey.get("cdc")?.lastCheckedAt,
                lastSuccessfulAt: sourcesByKey.get("cdc")?.lastSuccessfulAt,
                message: sourcesByKey.get("cdc")?.message,
              }}
            />
            <SourceRow
              data-testid="source-foodsafety"
              title="FoodSafety.gov database"
              href="https://www.foodsafety.gov/"
              status={sourcesByKey.get("foodsafety")?.status}
              timestamps={{
                lastCheckedAt: sourcesByKey.get("foodsafety")?.lastCheckedAt,
                lastSuccessfulAt: sourcesByKey.get("foodsafety")?.lastSuccessfulAt,
                message: sourcesByKey.get("foodsafety")?.message,
              }}
            />
          </div>
        </section>
      </main>

      <BottomTabs />
    </AppShell>
  );
}
