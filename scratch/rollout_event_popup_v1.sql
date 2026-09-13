ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_popup boolean NOT NULL DEFAULT false;
