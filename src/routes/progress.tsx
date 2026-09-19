import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, GraduationCap, ListChecks, Trophy } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  PanelLoader,
  PriorityBadge,
  SectionHeading,
  SkillBar,
  StatCard,
} from "@/components/career-ui";
import { Progress } from "@/components/ui/progress";
import { useCareerSession } from "@/hooks/useCareerSession";
import { hasProfile, progressStats, type Assessment } from "@/lib/career-types";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress dashboard — CareerPilot" },
      {
        name: "description",
        content:
          "Track completed roadmap items, practice tasks, projects and assessment scores in one place.",
      },
      { property: "og:title", content: "Progress dashboard — CareerPilot" },
      {
        property: "og:description",
        content: "Completion tracking across your roadmap, practice tasks and projects.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data, isLoading } = useCareerSession();

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading your progress" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="Nothing to track yet"
          body="Your progress dashboard fills up once you have a roadmap and start completing work."
        />
      </AppShell>
    );
  }

  const session = data!;
  const stats = progressStats(session);
  const assessment = (session.assessment ?? {}) as Assessment;
  const gaps = session.gaps ?? [];

  const chartData = [
    { name: "Completed", value: stats.done },
    { name: "Remaining", value: Math.max(0, stats.total - stats.done) },
  ];

  return (
    <AppShell>
      <SectionHeading
        title="Progress dashboard"
        description={`Everything you've completed on the way to ${session.target_role}.`}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Overall"
          value={`${stats.percent}%`}
          sub={`${stats.done} of ${stats.total} items`}
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          label="Roadmap"
          value={`${stats.roadmapDone}/${stats.roadmapTotal}`}
          icon={<ListChecks className="size-4" />}
        />
        <StatCard
          label="Practice tasks"
          value={`${stats.taskDone}/${stats.taskTotal}`}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          label="Assessment score"
          value={assessment.score != null ? `${assessment.score}%` : "—"}
          sub={assessment.takenAt ? new Date(assessment.takenAt).toLocaleDateString() : "Not taken yet"}
          icon={<GraduationCap className="size-4" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="panel p-6 lg:col-span-2">
          <h2 className="font-display text-lg">Completion</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={84}
                  strokeWidth={0}
                >
                  <Cell fill="var(--color-primary)" />
                  <Cell fill="var(--color-muted)" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <Progress value={stats.percent} />
            <p className="text-sm text-muted-foreground">
              {stats.projectDone} of {stats.projectTotal} portfolio projects finished.
            </p>
          </div>
        </section>

        <section className="panel space-y-4 p-6 lg:col-span-3">
          <h2 className="font-display text-lg">Gap closure</h2>
          {gaps.map((gap) => (
            <div key={gap.id} className="rounded-lg border border-border bg-surface/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{gap.skill}</p>
                <PriorityBadge priority={gap.priority} />
              </div>
              <div className="mt-3">
                <SkillBar label="Level" value={gap.currentLevel} target={gap.requiredLevel} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="font-display text-lg">Completed work</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ...(session.roadmap ?? []).flatMap((phase) =>
              (phase.items ?? []).filter((item) => item.done).map((item) => item.title),
            ),
            ...(session.tasks ?? []).filter((task) => task.done).map((task) => task.title),
            ...(session.projects ?? []).filter((project) => project.done).map((p) => p.title),
          ].map((title) => (
            <p key={title} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-success" />
              {title}
            </p>
          ))}
          {stats.done === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing completed yet — start with phase one of your roadmap.
            </p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
