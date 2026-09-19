import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PanelLoader, SectionHeading } from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { hasProfile, type Assessment } from "@/lib/career-types";
import { generateAssessment, submitAssessment } from "@/lib/career.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Skill assessment — CareerPilot" },
      {
        name: "description",
        content:
          "Take a short diagnostic quiz on your weakest skills and let CareerPilot rebuild your roadmap from the results.",
      },
      { property: "og:title", content: "Skill assessment — CareerPilot" },
      {
        property: "og:description",
        content: "A six-question diagnostic that re-prioritizes your learning plan.",
      },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { data, isLoading } = useCareerSession();
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const generate = useSessionMutation(generateAssessment, {
    successMessage: "New assessment ready",
  });
  const submit = useSessionMutation(submitAssessment, {
    successMessage: "Assessment evaluated — your plan was updated",
  });

  const assessment = (data?.assessment ?? {}) as Assessment;
  const questions = assessment.questions ?? [];
  const graded = assessment.takenAt != null;

  useEffect(() => {
    if (graded) setAnswers(assessment.answers ?? {});
  }, [graded, assessment.answers]);

  if (isLoading) {
    return (
      <AppShell>
        <PanelLoader label="Loading your assessment" />
      </AppShell>
    );
  }

  if (!hasProfile(data)) {
    return (
      <AppShell>
        <EmptyState
          title="Analyze a resume first"
          body="Assessments are built around your specific skill gaps, so CareerPilot needs your profile first."
        />
      </AppShell>
    );
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] != null);

  return (
    <AppShell>
      <SectionHeading
        title="Skill assessment"
        description="Six questions on your highest-priority gaps. The result reshapes your roadmap."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({});
              generate.mutate({});
            }}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {questions.length ? "Generate a new assessment" : "Generate my assessment"}
          </Button>
        }
      />

      {!questions.length ? (
        <div className="panel mt-8 p-10 text-center text-sm text-muted-foreground">
          No assessment yet — generate one to test what you actually know.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {questions.map((question, index) => (
              <article key={question.id} className="panel p-6">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  Question {index + 1} · {question.skill}
                </p>
                <h2 className="mt-2 text-base font-semibold">{question.question}</h2>
                <div className="mt-4 space-y-2">
                  {(question.options ?? []).map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    const isCorrect = graded && optionIndex === question.correctIndex;
                    const isWrongPick = graded && selected && !isCorrect;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={graded || submit.isPending}
                        onClick={() =>
                          setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border border-border bg-surface/40 px-4 py-3 text-left text-sm transition-colors",
                          !graded && "hover:border-primary/50",
                          selected && !graded && "border-primary/60 bg-primary/15",
                          isCorrect && "border-success/50 bg-success/15",
                          isWrongPick && "border-destructive/50 bg-destructive/15",
                        )}
                      >
                        {graded ? (
                          isCorrect ? (
                            <CheckCircle2 className="size-4 text-success" />
                          ) : isWrongPick ? (
                            <XCircle className="size-4 text-destructive" />
                          ) : (
                            <span className="size-4" />
                          )
                        ) : (
                          <span
                            className={cn(
                              "size-4 rounded-full border border-border",
                              selected && "border-primary bg-primary",
                            )}
                          />
                        )}
                        {option}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}

            {!graded ? (
              <Button
                size="lg"
                disabled={!allAnswered || submit.isPending}
                onClick={() => submit.mutate({ answers })}
              >
                {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit & re-plan
              </Button>
            ) : null}
          </div>

          <aside className="panel h-fit space-y-4 p-6">
            <h2 className="font-display text-lg">Evaluation</h2>
            {graded ? (
              <>
                <p className="font-display text-4xl">{assessment.score}%</p>
                <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-success uppercase">
                    Strengths
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(assessment.strengths ?? []).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wide text-warning uppercase">
                    Weaknesses
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(assessment.weaknesses ?? []).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
                <Button asChild variant="link" className="h-auto p-0">
                  <Link to="/adaptation">See how the plan changed</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Answer every question, then submit. CareerPilot grades it, names your strengths and
                weaknesses, and rewrites the roadmap accordingly.
              </p>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  );
}
