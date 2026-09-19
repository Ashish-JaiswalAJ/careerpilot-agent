import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type {
  Adaptation,
  Assessment,
  AssessmentQuestion,
  CareerProfile,
  CareerSession,
  Gap,
  PracticeProject,
  PracticeTask,
  RoadmapPhase,
} from "./career-types";

const SHAPE = `{
  "profile": {
    "summary": "2 sentences about the candidate",
    "experienceLevel": "student | intern | junior | mid",
    "skills": [{ "name": "React", "category": "Frontend", "level": 0-100 }],
    "languages": ["..."], "frameworks": ["..."], "databases": ["..."],
    "cloud": ["..."], "tools": ["..."],
    "projects": [{ "name": "...", "description": "...", "tech": ["..."] }],
    "certifications": ["..."]
  },
  "gaps": [{ "id": "kebab-id", "skill": "System design", "category": "Backend",
    "priority": "high|medium|low", "currentLevel": 0-100, "requiredLevel": 0-100,
    "reason": "why this matters for the target role" }],
  "roadmap": [{ "id": "phase-1", "title": "...", "window": "Weeks 1-2", "goal": "...",
    "items": [{ "id": "kebab-id", "title": "...", "skill": "...", "kind": "learn|build|practice", "hours": 6, "done": false }] }],
  "projects": [{ "id": "kebab-id", "title": "...", "description": "...", "skills": ["..."],
    "difficulty": "starter|intermediate|advanced", "steps": ["..."], "done": false }],
  "tasks": [{ "id": "kebab-id", "title": "...", "skill": "...", "minutes": 45, "done": false }]
}`;

const ANALYST_SYSTEM = `You are CareerPilot, an adaptive career and skill-gap agent for college students and
early-career developers. You read resumes, compare them against real hiring expectations for a target role,
and produce concrete, achievable plans. Be specific about technologies; never invent experience the resume
does not show. Use 5-8 gaps, 3-4 roadmap phases with 3-5 items each, 3 practice projects and 5-7 short tasks.
All ids must be unique kebab-case strings.
Return exactly this JSON shape: ${SHAPE}`;

const ADAPT_SYSTEM = `You are CareerPilot's replanning agent. You receive a learner's profile, their current plan,
which items they finished, and any assessment evidence. Rewrite the plan so it reflects the new evidence:
lower the priority of proven skills, raise or add gaps where the evidence shows weakness, drop or mark
completed work, and add harder follow-up work where they are ahead. Keep the "done" flags of items that are
already completed. Return JSON:
{
  "gaps": [...same gap shape...],
  "roadmap": [...same roadmap shape...],
  "projects": [...same project shape...],
  "tasks": [...same task shape...],
  "adaptation": { "summary": "one sentence on how the plan changed", "changes": ["concrete change", "..."] }
}`;

type AnalysisResult = {
  profile: CareerProfile;
  gaps: Gap[];
  roadmap: RoadmapPhase[];
  projects: PracticeProject[];
  tasks: PracticeTask[];
};

type AdaptResult = {
  gaps: Gap[];
  roadmap: RoadmapPhase[];
  projects: PracticeProject[];
  tasks: PracticeTask[];
  adaptation: { summary: string; changes: string[] };
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadRow(sessionKey: string): Promise<CareerSession | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("career_sessions")
    .select("*")
    .eq("session_key", sessionKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CareerSession | null) ?? null;
}

async function requireRow(sessionKey: string): Promise<CareerSession> {
  const row = await loadRow(sessionKey);
  if (!row) throw new Error("No analysis found yet. Upload a resume first.");
  return row;
}

async function saveRow(sessionKey: string, patch: Record<string, unknown>) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("career_sessions")
    .upsert(
      { session_key: sessionKey, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "session_key" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CareerSession;
}

function planSnapshot(row: CareerSession) {
  return JSON.stringify(
    {
      targetRole: row.target_role,
      profile: row.profile,
      gaps: row.gaps,
      roadmap: row.roadmap,
      projects: row.projects,
      tasks: row.tasks,
    },
    null,
    0,
  );
}

function newAdaptation(trigger: string, result: AdaptResult): Adaptation {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    trigger,
    summary: result.adaptation?.summary ?? "Plan updated with new evidence.",
    changes: result.adaptation?.changes ?? [],
  };
}

export const getCareerSession = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ sessionKey: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => loadRow(data.sessionKey));

export const saveTargetRole = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionKey: z.string().min(1),
        targetRole: z.string().min(2).max(120),
        experienceLevel: z.string().max(60).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) =>
    saveRow(data.sessionKey, {
      target_role: data.targetRole,
      experience_level: data.experienceLevel,
    }),
  );

export const analyzeResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionKey: z.string().min(1),
        targetRole: z.string().min(2).max(120),
        experienceLevel: z.string().max(60).default(""),
        resumeText: z.string().min(120, "That resume looks too short to analyze.").max(40000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { askAiForJson } = await import("./ai.server");
    const result = await askAiForJson<AnalysisResult>(
      ANALYST_SYSTEM,
      `Target role: ${data.targetRole}
Self-reported level: ${data.experienceLevel || "unspecified"}

RESUME TEXT:
"""
${data.resumeText.slice(0, 20000)}
"""`,
    );

    const emptyAssessment: Assessment = {
      questions: [],
      answers: {},
      score: null,
      strengths: [],
      weaknesses: [],
      feedback: "",
      takenAt: null,
    };

    return saveRow(data.sessionKey, {
      target_role: data.targetRole,
      experience_level: data.experienceLevel || result.profile?.experienceLevel || "",
      resume_text: data.resumeText.slice(0, 40000),
      profile: result.profile ?? {},
      gaps: result.gaps ?? [],
      roadmap: result.roadmap ?? [],
      projects: result.projects ?? [],
      tasks: result.tasks ?? [],
      assessment: emptyAssessment,
      adaptations: [
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          trigger: "Resume analyzed",
          summary: `Initial plan generated for ${data.targetRole}.`,
          changes: [
            `${result.gaps?.length ?? 0} skill gaps identified`,
            `${result.roadmap?.length ?? 0}-phase roadmap created`,
            `${result.projects?.length ?? 0} practice projects generated`,
          ],
        } satisfies Adaptation,
      ],
    });
  });

export const toggleItem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionKey: z.string().min(1),
        kind: z.enum(["roadmap", "task", "project"]),
        id: z.string().min(1),
        done: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const row = await requireRow(data.sessionKey);

    if (data.kind === "roadmap") {
      const roadmap = (row.roadmap ?? []).map((phase) => ({
        ...phase,
        items: (phase.items ?? []).map((item) =>
          item.id === data.id ? { ...item, done: data.done } : item,
        ),
      }));
      return saveRow(data.sessionKey, { roadmap });
    }
    if (data.kind === "task") {
      const tasks = (row.tasks ?? []).map((t) => (t.id === data.id ? { ...t, done: data.done } : t));
      return saveRow(data.sessionKey, { tasks });
    }
    const projects = (row.projects ?? []).map((p) =>
      p.id === data.id ? { ...p, done: data.done } : p,
    );
    return saveRow(data.sessionKey, { projects });
  });

export const generateAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionKey: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const row = await requireRow(data.sessionKey);
    const { askAiForJson } = await import("./ai.server");

    const result = await askAiForJson<{ questions: AssessmentQuestion[] }>(
      `You write short diagnostic quizzes for developers. Produce exactly 6 multiple-choice questions with 4
options each, targeting the learner's highest-priority skill gaps for their target role. Mix conceptual and
practical questions. Return JSON:
{ "questions": [{ "id": "q1", "skill": "...", "question": "...", "options": ["a","b","c","d"], "correctIndex": 0 }] }`,
      `Target role: ${row.target_role}
Skill gaps: ${JSON.stringify(row.gaps ?? [])}
Known skills: ${JSON.stringify((row.profile as CareerProfile)?.skills ?? [])}`,
    );

    const assessment: Assessment = {
      questions: (result.questions ?? []).slice(0, 8),
      answers: {},
      score: null,
      strengths: [],
      weaknesses: [],
      feedback: "",
      takenAt: null,
    };
    return saveRow(data.sessionKey, { assessment });
  });

export const submitAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionKey: z.string().min(1),
        answers: z.record(z.string(), z.number().int().min(0).max(5)),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const row = await requireRow(data.sessionKey);
    const current = row.assessment as Assessment;
    const questions = current?.questions ?? [];
    if (!questions.length) throw new Error("Generate an assessment before submitting one.");

    const graded = questions.map((q) => ({
      skill: q.skill,
      question: q.question,
      chosen: q.options?.[data.answers[q.id] ?? -1] ?? "no answer",
      correct: q.options?.[q.correctIndex] ?? "",
      isCorrect: data.answers[q.id] === q.correctIndex,
    }));
    const score = Math.round((graded.filter((g) => g.isCorrect).length / graded.length) * 100);

    const { askAiForJson } = await import("./ai.server");
    const evaluation = await askAiForJson<
      AdaptResult & { strengths: string[]; weaknesses: string[]; feedback: string }
    >(
      `${ADAPT_SYSTEM}

Also include "strengths": ["..."], "weaknesses": ["..."] and "feedback": "2-3 sentences of coaching".`,
      `The learner scored ${score}% on a diagnostic quiz.

GRADED ANSWERS:
${JSON.stringify(graded)}

CURRENT PLAN:
${planSnapshot(row)}

Completed work so far: ${JSON.stringify({
        roadmap: (row.roadmap ?? []).flatMap((p) => (p.items ?? []).filter((i) => i.done).map((i) => i.title)),
        tasks: (row.tasks ?? []).filter((t) => t.done).map((t) => t.title),
        projects: (row.projects ?? []).filter((p) => p.done).map((p) => p.title),
      })}`,
    );

    const assessment: Assessment = {
      questions,
      answers: data.answers,
      score,
      strengths: evaluation.strengths ?? [],
      weaknesses: evaluation.weaknesses ?? [],
      feedback: evaluation.feedback ?? "",
      takenAt: new Date().toISOString(),
    };

    return saveRow(data.sessionKey, {
      assessment,
      gaps: evaluation.gaps ?? row.gaps,
      roadmap: evaluation.roadmap ?? row.roadmap,
      projects: evaluation.projects ?? row.projects,
      tasks: evaluation.tasks ?? row.tasks,
      adaptations: [
        newAdaptation(`Assessment completed — scored ${score}%`, evaluation),
        ...(row.adaptations ?? []),
      ].slice(0, 20),
    });
  });

export const replanFromProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionKey: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const row = await requireRow(data.sessionKey);
    const { askAiForJson } = await import("./ai.server");

    const completed = {
      roadmap: (row.roadmap ?? []).flatMap((p) =>
        (p.items ?? []).filter((i) => i.done).map((i) => `${i.title} (${i.skill})`),
      ),
      tasks: (row.tasks ?? []).filter((t) => t.done).map((t) => `${t.title} (${t.skill})`),
      projects: (row.projects ?? []).filter((p) => p.done).map((p) => p.title),
    };
    const totalDone = completed.roadmap.length + completed.tasks.length + completed.projects.length;
    if (!totalDone) {
      throw new Error("Complete at least one task before asking for a replan.");
    }

    const result = await askAiForJson<AdaptResult>(
      ADAPT_SYSTEM,
      `The learner has completed work since the last plan.

COMPLETED: ${JSON.stringify(completed)}

ASSESSMENT EVIDENCE: ${JSON.stringify(row.assessment ?? {})}

CURRENT PLAN:
${planSnapshot(row)}`,
    );

    return saveRow(data.sessionKey, {
      gaps: result.gaps ?? row.gaps,
      roadmap: result.roadmap ?? row.roadmap,
      projects: result.projects ?? row.projects,
      tasks: result.tasks ?? row.tasks,
      adaptations: [
        newAdaptation(`Progress update — ${totalDone} items completed`, result),
        ...(row.adaptations ?? []),
      ].slice(0, 20),
    });
  });
