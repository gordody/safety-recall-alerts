import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell>
      <Seo title="Recall Guard — Not Found" description="Page not found." />
      <div className="safe-top pt-10 pb-24">
        <div className="mx-auto mt-12 max-w-md rounded-[1.35rem] border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/14 via-accent/12 to-transparent ring-1 ring-border/60">
              <Ghost className="h-6 w-6 text-foreground/70" />
            </div>
            <div>
              <h1 className="text-2xl">This page drifted away</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The link you opened doesn’t exist in this prototype.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/alerts" className="flex-1">
              <Button
                data-testid="btn-go-alerts"
                className="
                  w-full h-11 rounded-2xl
                  bg-gradient-to-r from-primary to-primary/80
                  text-primary-foreground shadow-lg shadow-primary/20
                  hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-md
                  transition-all duration-200 ease-out
                "
              >
                Go to Alerts
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button
                data-testid="btn-go-profile"
                variant="secondary"
                className="
                  w-full h-11 rounded-2xl bg-card/70 shadow-sm backdrop-blur
                  hover:bg-card hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-sm transition-all
                "
              >
                Open Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
