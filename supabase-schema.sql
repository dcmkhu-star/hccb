-- ══════════════════════════════════════════════════════════════
-- HCCB Site — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════

-- ── User roles ────────────────────────────────────────────────
CREATE TABLE public.user_roles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  email       TEXT,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Announcements ─────────────────────────────────────────────
CREATE TABLE public.announcements (
  id           SERIAL PRIMARY KEY,
  content      TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   UUID REFERENCES auth.users(id)
);
-- Seed one blank row so the admin always has something to edit
INSERT INTO public.announcements (content, is_published) VALUES ('', FALSE);

-- ── Event metadata (RSVP status for color-coded bars) ─────────
CREATE TABLE public.event_meta (
  id            SERIAL PRIMARY KEY,
  meetup_url    TEXT UNIQUE NOT NULL,
  event_name    TEXT NOT NULL,
  total_spots   INTEGER DEFAULT 0,
  rsvp_count    INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open', 'waitlist', 'closed')),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- ── Page sections (FAQ, Volunteer, About rich text) ───────────
CREATE TABLE public.page_sections (
  id           SERIAL PRIMARY KEY,
  page         TEXT NOT NULL,          -- 'faq' | 'volunteer' | 'about'
  section_key  TEXT NOT NULL,          -- e.g. 'faq_swimming', 'volunteer_intro'
  title        TEXT,
  content      TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN DEFAULT FALSE,
  position     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_by   UUID REFERENCES auth.users(id),
  UNIQUE(page, section_key)
);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.user_roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_meta    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's role
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.user_roles WHERE id = auth.uid()
$$;

-- ── user_roles policies ───────────────────────────────────────
CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "admins_manage_roles" ON public.user_roles
  USING (public.my_role() = 'admin');

-- ── announcements policies ────────────────────────────────────
-- Public (anon) can read published announcements
CREATE POLICY "public_reads_published_ann" ON public.announcements
  FOR SELECT USING (is_published = TRUE);
-- Logged-in users can read everything
CREATE POLICY "auth_reads_all_ann" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Editors and admins can write
CREATE POLICY "editors_write_ann" ON public.announcements
  FOR ALL USING (public.my_role() IN ('admin', 'editor'))
  WITH CHECK (public.my_role() IN ('admin', 'editor'));

-- ── event_meta policies ───────────────────────────────────────
-- Public can read event_meta (needed for color bars on main site)
CREATE POLICY "public_reads_event_meta" ON public.event_meta
  FOR SELECT USING (TRUE);
CREATE POLICY "editors_write_event_meta" ON public.event_meta
  FOR ALL USING (public.my_role() IN ('admin', 'editor'))
  WITH CHECK (public.my_role() IN ('admin', 'editor'));

-- ── page_sections policies ────────────────────────────────────
CREATE POLICY "public_reads_published_sections" ON public.page_sections
  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "auth_reads_all_sections" ON public.page_sections
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "editors_write_sections" ON public.page_sections
  FOR ALL USING (public.my_role() IN ('admin', 'editor'))
  WITH CHECK (public.my_role() IN ('admin', 'editor'));

-- ══════════════════════════════════════════════════════════════
-- Storage bucket for photos
-- Do this in Dashboard: Storage → New bucket → name: "site-media" → Public ✓
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- First admin setup (run AFTER you create your user via Dashboard → Auth → Users)
-- Replace the email below with yours, then run.
-- ══════════════════════════════════════════════════════════════
/*
INSERT INTO public.user_roles (id, role, email, full_name)
SELECT id, 'admin', email, 'Your Name'
FROM auth.users
WHERE email = 'your@email.com';
*/
