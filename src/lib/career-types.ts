export type Priority = "high" | "medium" | "low";

export type Skill = {
  name: string;
  category: string;
  level: number; // 0-100
};

export type CareerProfile = {
  summary: string;
  experienceLevel: string;
  skills: Skill[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  cloud: string[];
  tools: string[];
  projects: { name: string; description: string; tech: string[] }[];
  certifications: string[];
};

export type Gap = {
  id: string;
  skill: string;
  category: string;
  priority: Priority;
  currentLevel: number;
  requiredLevel: number;
  reason: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  skill: string;
  kind: "learn" | "build" | "practice";
  hours: number;
  done: boolean;
};

export type RoadmapPhase = {
  id: string;
  title: string;
  window: string;
  goal: string;
  items: RoadmapItem[];
};

export type PracticeProject = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: "starter" | "intermediate" | "advanced";
  steps: string[];
  done: boolean;
};

export type PracticeTask = {
  id: string;
  title: string;
  skill: string;
  minutes: number;
  done: boolean;
};

export type AssessmentQuestion = {
  id: string;
  skill: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type Assessment = {
  questions: AssessmentQuestion[];
  answers: Record<string, number>;
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  takenAt: string | null;
};

export type Adaptation = {
  id: string;
  at: string;
  trigger: string;
  summary: string;
  changes: string[];
};

export type CareerSession = {
  session_key: string;
  target_role: string;
  experience_level: string;
  resume_text: string;
  profile: CareerProfile | Record<string, never>;
  gaps: Gap[];
  roadmap: RoadmapPhase[];
  projects: PracticeProject[];
  tasks: PracticeTask[];
  assessment: Assessment | Record<string, never>;
  adaptations: Adaptation[];
  updated_at: string;
};

export const hasProfile = (s?: CareerSession | null): boolean =>
  !!s && !!(s.profile as CareerProfile)?.skills?.length;

export const priorityLabel: Record<Priority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function progressStats(session: CareerSession) {
  const roadmapItems = (session.roadmap ?? []).flatMap((p) => p.items ?? []);
  const tasks = session.tasks ?? [];
  const projects = session.projects ?? [];
  const all = [
    ...roadmapItems.map((i) => i.done),
    ...tasks.map((t) => t.done),
    ...projects.map((p) => p.done),
  ];
  const done = all.filter(Boolean).length;
  return {
    total: all.length,
    done,
    percent: all.length ? Math.round((done / all.length) * 100) : 0,
    roadmapDone: roadmapItems.filter((i) => i.done).length,
    roadmapTotal: roadmapItems.length,
    taskDone: tasks.filter((t) => t.done).length,
    taskTotal: tasks.length,
    projectDone: projects.filter((p) => p.done).length,
    projectTotal: projects.length,
  };
}
