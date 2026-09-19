import { Link } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { Priority } from "@/lib/career-types";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    high: "bg-destructive/15 text-destructive border-destructive/30",
    medium: "bg-warning/15 text-warning border-warning/30",
    low: "bg-success/15 text-success border-success/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        styles[priority] ?? styles.low,
      )}
    >
      {priority}
    </span>
  );
}

export function SkillBar({
  label,
  value,
  target,
  hint,
}: {
  label: string;
  value: number;
  target?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {value}%{target != null ? ` / ${target}% needed` : ""}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        {target != null ? (
          <div
            className="absolute inset-y-0 rounded-full bg-primary/20"
            style={{ width: `${Math.min(100, target)}%` }}
          />
        ) : null}
        <div
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel flex flex-col items-center gap-4 p-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="size-6" />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      </div>
      <Button asChild>
        <Link to="/setup">Start your analysis</Link>
      </Button>
    </div>
  );
}

export function PanelLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="panel flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
