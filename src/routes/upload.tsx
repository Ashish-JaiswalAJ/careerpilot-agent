import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileUp, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { SectionHeading } from "@/components/career-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCareerSession, useSessionMutation } from "@/hooks/useCareerSession";
import { analyzeResume } from "@/lib/career.functions";
import { extractPdfText } from "@/lib/pdf-text";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Resume upload & AI analysis — CareerPilot" },
      {
        name: "description",
        content:
          "Upload your resume PDF and let CareerPilot extract your skills, projects and experience level.",
      },
      { property: "og:title", content: "Resume upload & AI analysis — CareerPilot" },
      {
        property: "og:description",
        content: "Upload a resume PDF and get an AI-extracted skill profile in seconds.",
      },
    ],
  }),
  component: Upload,
});

const STAGES = [
  "Reading your resume",
  "Extracting skills, projects and tools",
  "Benchmarking against the target role",
  "Building your roadmap and projects",
];

function Upload() {
  const navigate = useNavigate();
  const { data } = useCareerSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [reading, setReading] = useState(false);
  const [stage, setStage] = useState(-1);

  const analyze = useSessionMutation(analyzeResume, {
    successMessage: "Analysis complete",
  });

  useEffect(() => {
    if (!analyze.isPending) {
      setStage(-1);
      return;
    }
    setStage(0);
    const timer = setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2600);
    return () => clearInterval(timer);
  }, [analyze.isPending]);

  const onFile = async (file: File) => {
    setReading(true);
    setFileName(file.name);
    try {
      const text = await extractPdfText(file);
      if (text.length < 120) {
        toast.error("We couldn't read text from that PDF. Paste your resume text instead.");
      } else {
        setResumeText(text);
        toast.success("Resume text extracted");
      }
    } catch {
      toast.error("That file couldn't be read. Try another PDF or paste the text.");
    } finally {
      setReading(false);
    }
  };

  const run = () => {
    if (!data?.target_role) {
      toast.error("Set your target role first.");
      navigate({ to: "/setup" });
      return;
    }
    analyze.mutate(
      {
        targetRole: data.target_role,
        experienceLevel: data.experience_level ?? "",
        resumeText: resumeText.trim(),
      },
      { onSuccess: () => navigate({ to: "/dashboard" }) },
    );
  };

  return (
    <AppShell>
      <SectionHeading
        title="Resume upload"
        description={
          data?.target_role
            ? `Analyzing against: ${data.target_role}`
            : "Set a target role on the profile setup page first."
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="panel space-y-5 p-6 lg:col-span-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center transition-colors hover:border-primary/50"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              {reading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FileUp className="size-5" />
              )}
            </span>
            <span className="text-sm font-semibold">
              {fileName || "Click to upload your resume PDF"}
            </span>
            <span className="text-xs text-muted-foreground">
              PDF only — the text is read in your browser
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="resume-text">Resume text</Label>
            <Textarea
              id="resume-text"
              rows={10}
              placeholder="Or paste your resume text here…"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {resumeText.trim().length} characters ready — 120 minimum.
            </p>
          </div>

          <Button
            size="lg"
            onClick={run}
            disabled={resumeText.trim().length < 120 || analyze.isPending}
          >
            {analyze.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Run AI analysis
          </Button>
        </div>

        <div className="panel space-y-4 p-6 lg:col-span-2">
          <h2 className="font-display text-lg">AI profile analysis</h2>
          <ul className="space-y-3">
            {STAGES.map((label, index) => {
              const active = stage === index;
              const complete = stage > index || (!analyze.isPending && !!data?.gaps?.length);
              return (
                <li key={label} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5">
                    {complete ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="block size-4 rounded-full border border-border" />
                    )}
                  </span>
                  <span className={complete || active ? "" : "text-muted-foreground"}>{label}</span>
                </li>
              );
            })}
          </ul>

          {data?.gaps?.length ? (
            <div className="rounded-lg border border-border bg-surface/40 p-4 text-sm">
              <p className="font-semibold">Last analysis ready</p>
              <p className="mt-1 text-muted-foreground">
                {data.gaps.length} gaps found for {data.target_role}.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0">
                <Link to="/dashboard">Open the skill-gap dashboard</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
