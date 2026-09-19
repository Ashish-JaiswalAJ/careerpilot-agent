import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Boxes, Cloud, Code2, Database, Layers, Target } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  PanelLoader,
  PriorityBadge,
  SectionHeading,
  SkillBar,
  StatCard,
} from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { useCareerSession } from "@/hooks/useCareerSession";
import { hasProfile, progressStats, type CareerProfile, type Priority } from "@/lib/career-types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Skill gap dashboard — CareerPilot" },
      {
        name: "description",
        content:
          "See the prioritized gaps between your current profile and your target role, with extracted skills and projects.",
      },
      { property: "og:title", content: "Skill gap dashboard — CareerPilot" },
      {
        property: "og:description",
        content: "Prioritized skill gaps and an AI-extracted profile of your resume.",
      },
    ],
  }),
  component: Dashboard,
});

const ORDER: Priority[] = ["high", "medium", "low"];

function Dashboard() {
  const { data, isLoading } = useCareerSession();

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading your profile" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="No analysis yet"
          body="Set your target role and upload a resume — CareerPilot will extract your skills and map them against the role."
        />
      </AppShell>
    );
  }

  const session = data!;
  const profile = session.profile as CareerProfile;
  const gaps = [...(session.gaps ?? [])].sort(
    (a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority),
  );
  const stats = progressStats(session);
  const highCount = gaps.filter((g) => g.priority === "high").length;

  const stacks: { label: string; icon: typeof Code2; items: string[] }[] = [
    { label: "Languages", icon: Code2, items: profile.languages ?? [] },
    { label: "Frameworks", icon: Layers, items: profile.frameworks ?? [] },
    { label: "Databases", icon: Database, items: profile.databases ?? [] },
    { label: "Cloud & DevOps", icon: Cloud, items: profile.cloud ?? [] },
    { label: "Tools", icon: Boxes, items: profile.tools ?? [] },
    { label: "Certifications", icon: Award, items: profile.certifications ?? [] },
  ];

  return (
    <AppShell>
      <SectionHeading
        title="Skill gap dashboard"
        description={`${profile.summary ?? ""}`}
        action={
          <Button asChild>
            <Link to="/roadmap">View roadmap</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Target role" value={session.target_role} icon={<Target className="size-4" />} />
        <StatCard
          label="Experience level"
          value={session.experience_level || profile.experienceLevel || "—"}
        />
        <StatCard label="Gaps found" value={String(gaps.length)} sub={`${highCount} high priority`} />
        <StatCard label="Plan progress" value={`${stats.percent}%`} sub={`${stats.done}/${stats.total} items done`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="panel space-y-5 p-6 lg:col-span-3">
          <h2 className="font-display text-lg">Prioritized skill gaps</h2>
          <div className="space-y-4">
            {gaps.map((gap) => (
              <div key={gap.id} className="rounded-xl border border-border bg-surface/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{gap.skill}</p>
                    <p className="text-xs text-muted-foreground">{gap.category}</p>
                  </div>
                  <PriorityBadge priority={gap.priority} />
                </div>
                <div className="mt-4">
                  <SkillBar
                    label="Current vs required"
                    value={gap.currentLevel}
                    target={gap.requiredLevel}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{gap.reason}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="panel space-y-4 p-6">
            <h2 className="font-display text-lg">Your strongest skills</h2>
            <div className="space-y-4">
              {[...(profile.skills ?? [])]
                .sort((a, b) => b.level - a.level)
                .slice(0, 7)
                .map((skill) => (
                  <SkillBar
                    key={skill.name}
                    label={skill.name}
                    value={skill.level}
                    hint={skill.category}
                  />
                ))}
            </div>
          </section>

          <section className="panel space-y-4 p-6">
            <h2 className="font-display text-lg">Extracted from your resume</h2>
            {stacks
              .filter((stack) => stack.items.length)
              .map(({ label, icon: Icon, items }) => (
                <div key={label}>
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <Icon className="size-3.5" />
                    {label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </section>

          {profile.projects?.length ? (
            <section className="panel space-y-4 p-6">
              <h2 className="font-display text-lg">Projects on your resume</h2>
              {profile.projects.map((project) => (
                <div key={project.name} className="rounded-lg border border-border bg-surface/40 p-4">
                  <p className="text-sm font-semibold">{project.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{project.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(project.tech ?? []).map((tech) => (
                      <span key={tech} className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
