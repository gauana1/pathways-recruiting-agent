-- Enable pgcrypto for gen_random_uuid() if not already available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── athletes ────────────────────────────────────────────────────────────────
CREATE TABLE athletes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  sport            TEXT        NOT NULL DEFAULT 'basketball' CHECK (sport IN ('basketball')),
  position         TEXT        NOT NULL,
  graduation_year  INTEGER     NOT NULL,
  height           TEXT,
  weight           NUMERIC,
  gpa              NUMERIC(3,2) CHECK (gpa >= 0 AND gpa <= 4.0),
  location         TEXT,
  target_division  TEXT        CHECK (target_division IN ('D1','D2','D3','NAIA')),
  target_schools   TEXT[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── reports ─────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id             UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sport                  TEXT        NOT NULL DEFAULT 'basketball',
  context                TEXT        NOT NULL CHECK (context IN ('game_film','practice','drill')),
  metrics                JSONB       NOT NULL,
  narrative              TEXT        NOT NULL,
  strengths              TEXT[]      NOT NULL DEFAULT '{}',
  areas_for_improvement  TEXT[]      NOT NULL DEFAULT '{}',
  recruitability_score   INTEGER     NOT NULL CHECK (recruitability_score >= 0 AND recruitability_score <= 100),
  comparable_level       TEXT        NOT NULL CHECK (comparable_level IN ('D1','D2','D3','NAIA')),
  is_featured            BOOLEAN     NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── schools ─────────────────────────────────────────────────────────────────
CREATE TABLE schools (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  sport            TEXT        NOT NULL DEFAULT 'basketball',
  division         TEXT        NOT NULL CHECK (division IN ('D1','D2','D3','NAIA')),
  conference       TEXT,
  location         TEXT,
  coach_name       TEXT,
  coach_email      TEXT,
  roster_summary   TEXT,
  research_output  JSONB       NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── outreach ─────────────────────────────────────────────────────────────────
CREATE TABLE outreach (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  school_id        UUID        NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  report_id        UUID        NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  subject          TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','approved','sent','opened','replied','followup_sent')),
  resend_email_id  TEXT,
  sent_at          TIMESTAMPTZ,
  opened_at        TIMESTAMPTZ,
  replied_at       TIMESTAMPTZ,
  followup_count   INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id         UUID        NOT NULL UNIQUE REFERENCES athletes(id) ON DELETE CASCADE,
  is_public          BOOLEAN     NOT NULL DEFAULT false,
  headline           TEXT,
  featured_report_id UUID        REFERENCES reports(id) ON DELETE SET NULL,
  slug               TEXT        NOT NULL UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER outreach_updated_at
  BEFORE UPDATE ON outreach
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- athletes: owners only
CREATE POLICY athletes_select ON athletes FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY athletes_insert ON athletes FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY athletes_update ON athletes FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY athletes_delete ON athletes FOR DELETE USING (auth.uid() = auth_user_id);

-- reports: owners via athlete
CREATE POLICY reports_select ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = reports.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM athletes a WHERE a.id = reports.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY reports_update ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = reports.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY reports_delete ON reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = reports.athlete_id AND a.auth_user_id = auth.uid()));

-- schools: owners via athlete
CREATE POLICY schools_select ON schools FOR SELECT
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = schools.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY schools_insert ON schools FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM athletes a WHERE a.id = schools.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY schools_update ON schools FOR UPDATE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = schools.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY schools_delete ON schools FOR DELETE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = schools.athlete_id AND a.auth_user_id = auth.uid()));

-- outreach: owners via athlete
CREATE POLICY outreach_select ON outreach FOR SELECT
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = outreach.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY outreach_insert ON outreach FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM athletes a WHERE a.id = outreach.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY outreach_update ON outreach FOR UPDATE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = outreach.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY outreach_delete ON outreach FOR DELETE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = outreach.athlete_id AND a.auth_user_id = auth.uid()));

-- profiles: public profiles are readable by everyone; owners can manage their own
CREATE POLICY profiles_select_public ON profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY profiles_select_owner ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = profiles.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM athletes a WHERE a.id = profiles.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = profiles.athlete_id AND a.auth_user_id = auth.uid()));

CREATE POLICY profiles_delete ON profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM athletes a WHERE a.id = profiles.athlete_id AND a.auth_user_id = auth.uid()));
