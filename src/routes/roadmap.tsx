import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Dumbbell, Hammer, Loader2, RefreshCcw } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PanelLoader, SectionHeading } from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { hasProfile } from "@/lib/career-types";
import { replanFromProgress, toggleItem } from "@/lib/career.functions";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Personalized roadmap — CareerPilot" },
      {
        name: "description",
        content:
          "A phased learning roadmap built from your skill gaps, with tasks you can tick off as you go.",
      },
      { property: "og:title", content: "Personalized roadmap — CareerPilot" },
      {
        property: "og:description",
        content: "Phased learning plan generated from your resume and target role.",
      },
    ],
  }),
  component: Roadmap,
});

const KIND_ICON = { learn: BookOpen, build: Hammer, practice: Dumbbell } as const;

function Roadmap() {
  const { data, isLoading } = useCareerSession();
  const toggle = useSessionMutation(toggleItem);
  const replan = useSessionMutation(replanFromProgress, {
    successMessage: "Roadmap re-planned with your progress",
  });

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading your roadmap" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="No roadmap yet"
          body="Once CareerPilot analyzes your resume it builds a phased roadmap for your target role."
        />
      </AppShell>
    );
  }

  const phases = data!.roadmap ?? [];

  return (
    <AppShell>
      <SectionHeading
        title="Personalized roadmap"
        description={`Sequenced for ${data!.target_role}. Tick items off — the agent uses them to replan.`}
        action={
          <Button onClick={() => replan.mutate({})} disabled={replan.isPending} variant="secondary">
            {replan.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            Adapt roadmap to my progress
          </Button>
        }
      />

      <div className="mt-8 space-y-6">
        {phases.map((phase, index) => {
          const items = phase.items ?? [];
          const done = items.filter((item) => item.done).length;
          const percent = items.length ? Math.round((done / items.length) * 100) : 0;

          return (
            <section key={phase.id} className="relative pl-6">
              <span className="absolute top-6 left-0 flex size-3 rounded-full bg-primary" />
              {index < phases.length - 1 ? (
                <span className="absolute top-9 bottom-0 left-[5px] w-px bg-border" />
              ) : null}

              <div className="panel p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                      {phase.window}
                    </p>
                    <h2 className="mt-1 font-display text-lg">{phase.title}</h2>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">{phase.goal}</p>
                  </div>
                  <div className="w-40">
                    <Progress value={percent} />
                    <p className="mt-1.5 text-right text-xs text-muted-foreground">
                      {done}/{items.length} done
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2">
                  {items.map((item) => {
                    const Icon = KIND_ICON[item.kind] ?? BookOpen;
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={item.done}
                          onCheckedChange={(checked) =>
                            toggle.mutate({ kind: "roadmap", id: item.id, done: checked === true })
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={
                              item.done ? "text-sm line-through opacity-60" : "text-sm font-medium"
                            }
                          >
                            {item.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon className="size-3.5" />
                            {item.skill} · ~{item.hours}h
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
