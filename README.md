# CareerPilot

An AI-powered adaptive career and skill-gap agent for college students and early-career developers.

Upload a resume, pick a target role, and CareerPilot extracts your profile, prioritizes your skill
gaps, builds a phased roadmap with practice tasks and portfolio projects — then rewrites the plan as
you complete work and take assessments.

## Core flow

1. **Landing** (`/`) — product overview.
2. **Profile setup** (`/setup`) — target role + current level.
3. **Resume upload & AI analysis** (`/upload`) — PDF text is extracted in the browser, then analyzed.
4. **Skill gap dashboard** (`/dashboard`) — extracted skills, stacks, projects, prioritized gaps.
5. **Roadmap** (`/roadmap`) — phased plan with completion tracking.
6. **Practice & projects** (`/practice`) — hands-on work per gap.
7. **Assessment** (`/assessment`) — 6-question diagnostic, graded with strengths/weaknesses.
8. **Progress** (`/progress`) — completion stats and gap closure.
9. **AI replanning** (`/adaptation`) — transparent log of every plan change and what triggered it.

## Adaptive behaviour

Two triggers cause the agent to re-derive gaps, roadmap, projects and tasks:

- completing roadmap items, tasks or projects, then requesting a re-plan;
- submitting an assessment, which is graded and fed back into the planner.

Each replan appends an entry to the adaptation log with a summary and a list of concrete changes.

## Tech

- **TanStack Start** (React 19, Vite, file-based routing, server functions)
- **Tailwind CSS v4** design system (dark navy / white / blue tokens in `src/styles.css`)
- **Lovable Cloud** (Postgres) for session state — one `career_sessions` row per anonymous visitor
- **Lovable AI Gateway** (Gemini) for resume analysis, assessment generation, grading and replanning
- **pdfjs-dist** for client-side resume text extraction

No authentication and no payments — the visitor's session id lives in `localStorage` and all database
access happens through server functions.

## Project structure

```
src/
  components/      app shell + shared UI (skill bars, badges, stat cards)
  hooks/           session query/mutation helpers
  lib/
    ai.server.ts        AI gateway client
    career.functions.ts  server functions (analyze, toggle, assess, replan)
    career-types.ts      shared domain types
    pdf-text.ts          browser PDF text extraction
  routes/          one file per screen
drizzle/migrations/  database schema
```

## Local development

```bash
bun install
bun run dev      # http://localhost:8080
bun run build    # production build
```

Environment variables (`.env`) are managed by Lovable Cloud: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, plus server-side `SUPABASE_*` and `LOVABLE_API_KEY`.
