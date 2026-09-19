import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  FileSearch,
  Gauge,
  Map,
  RefreshCcw,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const STEPS = [
  {
    icon: Target,
    title: "Pick a target role",
    body: "Frontend, backend, data, cloud — tell CareerPilot where you're heading.",
  },
  {
    icon: FileSearch,
    title: "Upload your resume",
    body: "The agent extracts languages, frameworks, databases, cloud tools, projects and certifications.",
  },
  {
    icon: Gauge,
    title: "See prioritized gaps",
    body: "Every missing skill gets a high, medium or low priority with the reason behind it.",
  },
  {
    icon: Map,
    title: "Follow a live roadmap",
    body: "Phased learning plan with practice tasks and portfolio projects for each gap.",
  },
  {
    icon: BarChart3,
    title: "Take an assessment",
    body: "A short diagnostic quiz turns guesses into evidence about what you actually know.",
  },
  {
    icon: RefreshCcw,
    title: "Watch it replan",
    body: "New progress or quiz results rewrite the plan — priorities shift, harder work appears.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-aurora">
        <div className="bg-grid">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <span className="font-display text-lg font-semibold">CareerPilot</span>
            <Button asChild variant="secondary" size="sm">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          </header>

          <section className="mx-auto max-w-6xl px-6 pt-14 pb-24 md:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Adaptive AI career agent
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
              <span className="text-gradient">Close the gap</span> between your resume and the role
              you want.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              CareerPilot reads your resume, compares it against real expectations for your target
              role, and builds a roadmap that rewrites itself as you learn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/setup">
                  Analyze my resume
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/roadmap">See a roadmap</Link>
              </Button>
            </div>

            <dl className="mt-16 grid gap-4 sm:grid-cols-3">
              {[
                ["Skills extracted", "Languages, frameworks, databases, cloud"],
                ["Gaps prioritized", "High / medium / low with reasoning"],
                ["Plan adapts", "Every task you finish changes the plan"],
              ].map(([label, body]) => (
                <div key={label} className="panel p-5">
                  <dt className="font-display text-base">{label}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl md:text-3xl">How the agent works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="panel p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <span>CareerPilot — adaptive career & skill-gap agent</span>
          <Link to="/setup" className="text-foreground hover:text-primary">
            Get started
          </Link>
        </div>
      </footer>
    </div>
  );
}
