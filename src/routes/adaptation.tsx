import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Loader2, RefreshCcw, Wand2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PanelLoader, SectionHeading } from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { hasProfile, progressStats, type Assessment } from "@/lib/career-types";
import { replanFromProgress } from "@/lib/career.functions";

export const Route = createFileRoute("/adaptation")({
  head: () => ({
    meta: [
      { title: "AI replanning — CareerPilot" },
      {
        name: "description",
        content:
          "See every time CareerPilot rewrote your plan, what triggered it, and exactly what changed.",
      },
      { property: "og:title", content: "AI replanning — CareerPilot" },
      {
        property: "og:description",
        content: "A transparent log of the agent's adaptations to your progress and assessments.",
      },
    ],
  }),
  component: Adaptation,
});

function Adaptation() {
  const { data, isLoading } = useCareerSession();
  const replan = useSessionMutation(replanFromProgress, {
    successMessage: "Plan adapted",
  });

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading the adaptation log" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="No adaptations yet"
          body="Once you have a plan, every completed task and assessment triggers the agent to re-plan."
        />
      </AppShell>
    );
  }

  const session = data!;
  const stats = progressStats(session);
  const assessment = (session.assessment ?? {}) as Assessment;
  const adaptations = session.adaptations ?? [];

  return (
    <AppShell>
      <SectionHeading
        title="AI adaptation & replanning"
        description="CareerPilot re-derives your gaps, roadmap, projects and tasks whenever new evidence arrives."
        action={
          <Button onClick={() => replan.mutate({})} disabled={replan.isPending}>
            {replan.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            Re-plan now
          </Button>
        }
      />

      <div className="panel mt-6 grid gap-4 p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Evidence: progress
          </p>
          <p className="mt-2 text-sm">
            {stats.done} completed items out of {stats.total}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Evidence: assessment
          </p>
          <p className="mt-2 text-sm">
            {assessment.score != null ? `${assessment.score}% score recorded` : "No assessment yet"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Replans so far
          </p>
          <p className="mt-2 text-sm">{adaptations.length}</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {adaptations.map((entry, index) => (
          <article key={entry.id} className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Wand2 className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{entry.trigger}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.at).toLocaleString()}
                  </p>
                </div>
              </div>
              {index === 0 ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Current plan
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm">{entry.summary}</p>
            <ul className="mt-3 space-y-1.5">
              {(entry.changes ?? []).map((change) => (
                <li key={change} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3.5 text-primary" />
                  {change}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
