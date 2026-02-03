import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, MapPin, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IosTopBar } from "@/components/IosTopBar";
import { BottomTabs } from "@/components/BottomTabs";
import { GlassCard } from "@/components/GlassCard";
import { Seo } from "@/components/Seo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useSupportedMeta } from "@/hooks/use-meta";
import { useProfile, useUpsertProfile } from "@/hooks/use-profile";

type FormState = {
  displayName: string;
  state: string;
  useCurrentLocation: boolean;
  pushAlertsEnabled: boolean;
  dailyDigestEnabled: boolean;
  dietaryRestrictions: string[];
  allergies: string[];
};

export default function ProfilePage() {
  const { toast } = useToast();
  const metaQ = useSupportedMeta();
  const profileQ = useProfile();
  const upsertM = useUpsertProfile();

  const states = metaQ.data?.states ?? [];
  const allergens = metaQ.data?.allergens ?? [];
  const dietary = metaQ.data?.dietaryRestrictions ?? [];

  const initial = useMemo<FormState | null>(() => {
    const p = profileQ.data;
    if (!p) return null;
    return {
      displayName: p.displayName ?? "",
      state: p.state,
      useCurrentLocation: p.useCurrentLocation,
      pushAlertsEnabled: p.pushAlertsEnabled,
      dailyDigestEnabled: p.dailyDigestEnabled,
      dietaryRestrictions: p.dietaryRestrictions ?? [],
      allergies: p.allergies ?? [],
    };
  }, [profileQ.data]);

  const [form, setForm] = useState<FormState>({
    displayName: "",
    state: "CA",
    useCurrentLocation: true,
    pushAlertsEnabled: true,
    dailyDigestEnabled: true,
    dietaryRestrictions: [],
    allergies: [],
  });

  useEffect(() => {
    if (initial) setForm(initial);
    else if (!profileQ.isLoading && !profileQ.isError) {
      // no profile exists yet — keep defaults but ensure state is valid
      setForm((prev) => ({
        ...prev,
        state: states[0] ?? prev.state ?? "CA",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, states.join("|")]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayItem(key: "allergies" | "dietaryRestrictions", item: string, next: boolean) {
    setForm((prev) => {
      const cur = new Set(prev[key]);
      if (next) cur.add(item);
      else cur.delete(item);
      return { ...prev, [key]: Array.from(cur) };
    });
  }

  async function save() {
    // Basic client-side validation
    if (!form.displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Add a name so alerts feel personal.",
        variant: "destructive",
      });
      return;
    }
    if (!states.includes(form.state as any)) {
      toast({
        title: "Choose a valid state",
        description: "State must be a 2-letter US code.",
        variant: "destructive",
      });
      return;
    }

    upsertM.mutate(
      {
        displayName: form.displayName.trim(),
        state: form.state as any,
        useCurrentLocation: form.useCurrentLocation,
        pushAlertsEnabled: form.pushAlertsEnabled,
        dailyDigestEnabled: form.dailyDigestEnabled,
        dietaryRestrictions: form.dietaryRestrictions as any,
        allergies: form.allergies as any,
      },
      {
        onSuccess: () => {
          toast({
            title: "Saved",
            description: "Your preferences will be used for relevant alerts.",
          });
        },
        onError: (e) => {
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <AppShell>
      <Seo
        title="Recall Guard — Profile"
        description="Set your location, allergies, and dietary restrictions to get relevant recall alerts."
      />

      <IosTopBar
        title="Profile"
        subtitle="Fine-tune what you care about"
        rightHref="/alerts"
        rightLabel="Back to alerts"
        className="pb-3"
      />

      <main className="pb-24">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            data-testid="btn-back-alerts"
            variant="secondary"
            onClick={() => (window.location.href = "/alerts")}
            className="
              h-11 rounded-2xl bg-card/70 shadow-sm backdrop-blur
              hover:bg-card hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm transition-all
            "
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alerts
          </Button>

          <Button
            data-testid="btn-save-profile"
            onClick={save}
            disabled={upsertM.isPending}
            className="
              h-11 rounded-2xl
              bg-gradient-to-r from-primary to-primary/80
              text-primary-foreground shadow-lg shadow-primary/20
              hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5
              active:translate-y-0 active:shadow-md
              transition-all duration-200 ease-out
            "
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {upsertM.isPending ? "Saving…" : "Save"}
          </Button>
        </div>

        <GlassCard>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/14 via-accent/12 to-transparent ring-1 ring-border/60">
              <MapPin className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <h2 className="text-2xl leading-tight">Your preferences</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We'll use these to rank what’s relevant and what can be safely ignored.
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-sm font-extrabold tracking-tight">Display name</p>
              <p className="mt-1 text-xs text-muted-foreground">Shown in your digest and alerts.</p>
              {profileQ.isLoading ? (
                <Skeleton className="mt-2 h-11 w-full rounded-2xl" />
              ) : (
                <Input
                  data-testid="input-display-name"
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                  placeholder="e.g., Jordan"
                  className="
                    mt-2 h-11 rounded-2xl bg-background/60 shadow-sm backdrop-blur
                    border-border/70 focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary/40
                  "
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
              <div>
                <p className="text-sm font-extrabold tracking-tight">Location (state)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We match state-level distribution in recall postings.
                </p>
              </div>

              {metaQ.isLoading || profileQ.isLoading ? (
                <Skeleton className="h-11 w-full rounded-2xl" />
              ) : (
                <Select
                  value={form.state}
                  onValueChange={(v) => set("state", v)}
                  disabled={form.useCurrentLocation}
                >
                  <SelectTrigger
                    data-testid="profile-select-state"
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

              <div className="sm:col-span-2">
                <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur">
                  <div>
                    <p className="text-sm font-extrabold tracking-tight">Using current location</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Locks state selection when enabled.
                    </p>
                  </div>
                  <Switch
                    data-testid="profile-toggle-use-current-location"
                    checked={form.useCurrentLocation}
                    onCheckedChange={(v) => set("useCurrentLocation", v)}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-extrabold tracking-tight">Daily digest</p>
                <p className="mt-1 text-xs text-muted-foreground">One summary per day.</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {form.dailyDigestEnabled ? "Enabled" : "Off"}
                  </span>
                  <Switch
                    data-testid="profile-toggle-daily-digest"
                    checked={form.dailyDigestEnabled}
                    onCheckedChange={(v) => set("dailyDigestEnabled", v)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-extrabold tracking-tight">Push alerts</p>
                <p className="mt-1 text-xs text-muted-foreground">Immediate nudges (prototype).</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {form.pushAlertsEnabled ? "Enabled" : "Off"}
                  </span>
                  <Switch
                    data-testid="profile-toggle-push-alerts"
                    checked={form.pushAlertsEnabled}
                    onCheckedChange={(v) => set("pushAlertsEnabled", v)}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="rounded-[1.35rem] border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-destructive/14 via-[hsl(32_92%_52%/0.12)] to-transparent ring-1 ring-border/60">
                  <ShieldAlert className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold tracking-tight">Allergies</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select allergens you want flagged.
                  </p>
                </div>
              </div>

              {metaQ.isLoading ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allergens.map((a) => {
                    const checked = form.allergies.includes(a);
                    return (
                      <label
                        key={a}
                        className="
                          group flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60
                          bg-background/60 px-3 py-3 shadow-sm backdrop-blur
                          transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md
                        "
                      >
                        <Checkbox
                          data-testid={`allergy-${a}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleArrayItem("allergies", a, !!v)}
                        />
                        <span className="text-sm font-bold capitalize">{a}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[1.35rem] border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-extrabold tracking-tight">Dietary restrictions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Helpful for filtering ingredient-related notices.
              </p>

              {metaQ.isLoading ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {dietary.map((d) => {
                    const checked = form.dietaryRestrictions.includes(d);
                    return (
                      <label
                        key={d}
                        className="
                          group flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60
                          bg-background/60 px-3 py-3 shadow-sm backdrop-blur
                          transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md
                        "
                      >
                        <Checkbox
                          data-testid={`diet-${d}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleArrayItem("dietaryRestrictions", d, !!v)}
                        />
                        <span className="text-sm font-bold capitalize">{d.replace("-", " ")}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-2 rounded-2xl border border-border/60 bg-background/50 p-4 text-xs text-muted-foreground">
              Tip: after saving, go back to Alerts and tap “Refresh now” to simulate a daily check.
            </div>
          </div>
        </GlassCard>
      </main>

      <BottomTabs />
    </AppShell>
  );
}
