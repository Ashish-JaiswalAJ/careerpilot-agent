CREATE TABLE public.career_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL UNIQUE,
  target_role text NOT NULL DEFAULT '',
  experience_level text NOT NULL DEFAULT '',
  resume_text text NOT NULL DEFAULT '',
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  roadmap jsonb NOT NULL DEFAULT '[]'::jsonb,
  projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessment jsonb NOT NULL DEFAULT '{}'::jsonb,
  adaptations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.career_sessions TO service_role;

ALTER TABLE public.career_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX career_sessions_session_key_idx ON public.career_sessions (session_key);