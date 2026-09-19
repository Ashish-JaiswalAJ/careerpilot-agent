import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SectionHeading } from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { saveTargetRole } from "@/lib/career.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Profile setup — CareerPilot" },
      {
        name: "description",
        content: "Choose your target role and experience level so CareerPilot can benchmark your resume.",
      },
      { property: "og:title", content: "Profile setup — CareerPilot" },
      {
        property: "og:description",
        content: "Choose your target role and experience level to start your skill-gap analysis.",
      },
    ],
  }),
  component: Setup,
});

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps / Cloud Engineer",
  "Mobile Developer",
  "QA / Automation Engineer",
];

const LEVELS = ["Student", "Intern", "Fresher", "0-1 years", "1-3 years"];

function Setup() {
  const navigate = useNavigate();
  const { data } = useCareerSession();
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    if (data?.target_role) setRole(data.target_role);
    if (data?.experience_level) setLevel(data.experience_level);
  }, [data?.target_role, data?.experience_level]);

  const save = useSessionMutation(saveTargetRole);

  const submit = () => {
    save.mutate(
      { targetRole: role.trim(), experienceLevel: level },
      { onSuccess: () => navigate({ to: "/upload" }) },
    );
  };

  return (
    <AppShell>
      <SectionHeading
        title="Profile setup"
        description="Tell CareerPilot what you're aiming for. Everything after this — gaps, roadmap, projects, assessments — is benchmarked against this role."
      />

      <div className="panel mt-8 space-y-8 p-6 md:p-8">
        <div className="space-y-3">
          <Label htmlFor="role">Target role</Label>
          <Input
            id="role"
            placeholder="e.g. Backend Developer"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {ROLES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRole(preset)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                  role === preset && "border-primary/50 bg-primary/15 text-foreground",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Where are you today?</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLevel(preset)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                  level === preset && "border-primary/50 bg-primary/15 text-foreground",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={submit} disabled={role.trim().length < 2 || save.isPending} size="lg">
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue to resume upload
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </AppShell>
  );
}
