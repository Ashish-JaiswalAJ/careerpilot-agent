import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Map,
  Rocket,
  TrendingUp,
  Wand2,
} from "lucide-react";
import type { ReactNode } from "react";

import { useCareerSession } from "@/hooks/useCareerSession";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/setup", label: "Profile setup", icon: FileText },
  { to: "/upload", label: "Resume upload", icon: Rocket },
  { to: "/dashboard", label: "Skill gaps", icon: LayoutDashboard },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/practice", label: "Practice & projects", icon: GraduationCap },
  { to: "/assessment", label: "Assessment", icon: Compass },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/adaptation", label: "AI replanning", icon: Wand2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useCareerSession();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">CareerPilot</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === to && "bg-primary/15 text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          <p className="text-xs text-muted-foreground">Target role</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {data?.target_role || "Not set yet"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 overflow-x-auto border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground",
                pathname === to && "border-primary/40 bg-primary/15 text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
