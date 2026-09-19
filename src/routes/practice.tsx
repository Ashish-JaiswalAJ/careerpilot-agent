import { createFileRoute } from "@tanstack/react-router";
import { CircleDot, Timer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PanelLoader, SectionHeading } from "@/components/career-ui";
import { Checkbox } from "@/components/ui/checkbox";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { hasProfile } from "@/lib/career-types";
import { toggleItem } from "@/lib/career.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice & projects — CareerPilot" },
      {
        name: "description",
        content:
          "Hands-on practice tasks and portfolio projects generated for each of your skill gaps.",
      },
      { property: "og:title", content: "Practice & projects — CareerPilot" },
      {
        property: "og:description",
        content: "Portfolio projects and short practice tasks targeted at your skill gaps.",
      },
    ],
  }),
  component: Practice;
});

function Practice() {
  const { data, isLoading } = useCareerSession();
  const toggle = useSessionMutation(toggleItem);

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading your practice plan" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="No practice plan yet"
          body="CareerPilot generates projects and practice tasks once it knows your gaps."
        />
      </AppShell>
    );
  }

  const projects = data!.projects ?? [];
  const tasks = data!.tasks ?? [];

  const difficultyStyles: Record<string, string> = {
    starter: "bg-success/15 text-success",
    intermediate: "bg-warning/15 text-warning",
    advanced: "bg-destructive/15 text-destructive",
  };

  return (
    <AppShell>
      <SectionHeading
        title="Practice & projects"
        description="Build these to turn gaps into evidence. Marking work done feeds the agent's replanning."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          {projects.map((project) => (
            <article key={project.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={cn("font-display text-lg", project.done && "line-through opacity-60")}>
                    {project.title}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    difficultyStyles[project.difficulty] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {project.difficulty}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(project.skills ?? []).map((skill) => (
                  <span key={skill} className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    {skill}
                  </span>
                ))}
              </div>

              <ol className="mt-4 space-y-2">
                {(project.steps ?? []).map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-display text-xs text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <Checkbox
                  checked={project.done}
                  onCheckedChange={(checked) =>
                    toggle.mutate({ kind: "project", id: project.id, done: checked === true })
                  }
                />
                Mark this project complete
              </label>
            </article>
          ))}
        </section>

        <section className="panel h-fit space-y-3 p-6">
          <h2 className="font-display text-lg">Short practice tasks</h2>
          {tasks.map((task) => (
            <label
              key={task.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface/40 p-3"
            >
              <Checkbox
                className="mt-0.5"
                checked={task.done}
                onCheckedChange={(checked) =>
                  toggle.mutate({ kind: "task", id: task.id, done: checked === true })
                }
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", task.done && "line-through opacity-60")}>
                  {task.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <CircleDot className="size-3" />
                  {task.skill}
                  <Timer className="ml-1 size-3" />
                  {task.minutes} min
                </span>
              </span>
            </label>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
