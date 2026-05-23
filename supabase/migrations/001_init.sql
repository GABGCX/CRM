-- ============================================================
-- OutboundCRM — Schema com multi-tenancy e RLS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ORGANIZATIONS ────────────────────────────────────────
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  custom_domain text UNIQUE,
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  theme         jsonb NOT NULL DEFAULT '{
    "primary_color": "#2563eb",
    "accent_color": "#60a5fa",
    "logo_url": null,
    "favicon_url": null,
    "product_name": "OutboundCRM"
  }'::jsonb,
  settings      jsonb NOT NULL DEFAULT '{
    "ticket_medio": 2000,
    "meta_mensal": 10000,
    "timezone": "America/Fortaleza"
  }'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── PROFILES ─────────────────────────────────────────────
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text,
  role       text NOT NULL DEFAULT 'bdr' CHECK (role IN ('owner','admin','bdr')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── LEADS ────────────────────────────────────────────────
CREATE TABLE leads (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  decisor           text NOT NULL DEFAULT '',
  telefone          text,
  negocio           text,
  instagram         text,
  num_vendedores    int,
  nome_ponte        text,
  resultado         text NOT NULL DEFAULT 'Aguardando retorno'
    CHECK (resultado IN (
      'Aguardando retorno','Follow-up','De molho','Reunião agendada',
      'Enviar proposta','Proposta enviada','Fechado','Recusado',
      'Sem interesse','Não atende'
    )),
  data_retorno      date,
  reuniao_agendada  boolean NOT NULL DEFAULT false,
  turno             text,
  horario           text,
  info              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── FOLLOWUPS ────────────────────────────────────────────
CREATE TABLE followups (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id        uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attempt_index  int NOT NULL CHECK (attempt_index BETWEEN 0 AND 9),
  completed_at   timestamptz,
  UNIQUE (lead_id, attempt_index)
);

-- ─── DAILY DIARY ──────────────────────────────────────────
CREATE TABLE daily_diary (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date       date NOT NULL,
  ce         int NOT NULL DEFAULT 0,
  rm         int NOT NULL DEFAULT 0,
  rr         int NOT NULL DEFAULT 0,
  fr         int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- ─── ÍNDICES ──────────────────────────────────────────────
CREATE INDEX idx_profiles_org    ON profiles(org_id);
CREATE INDEX idx_leads_org       ON leads(org_id);
CREATE INDEX idx_leads_retorno   ON leads(org_id, data_retorno) WHERE data_retorno IS NOT NULL;
CREATE INDEX idx_followups_lead  ON followups(lead_id);
CREATE INDEX idx_followups_org   ON followups(org_id);
CREATE INDEX idx_diary_org_date  ON daily_diary(org_id, date);
CREATE INDEX idx_orgs_slug       ON organizations(slug);
CREATE INDEX idx_orgs_domain     ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated     BEFORE UPDATE ON organizations  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles       FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_leads_updated    BEFORE UPDATE ON leads          FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_diary_updated    BEFORE UPDATE ON daily_diary    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── JWT CUSTOM CLAIMS ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims      jsonb;
  profile_row profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_row FROM profiles WHERE id = (event->>'user_id')::uuid;
  claims := event->'claims';
  IF profile_row.id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}',   to_jsonb(profile_row.org_id::text));
    claims := jsonb_set(claims, '{org_role}', to_jsonb(profile_row.role));
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_diary    ENABLE ROW LEVEL SECURITY;

-- Função no schema PUBLIC (auth schema é restrito no Supabase)
-- SECURITY DEFINER para poder consultar profiles sem expor dados
CREATE OR REPLACE FUNCTION public.get_org_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'org_id')::uuid,
    (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Garantir que authenticated pode chamar
GRANT EXECUTE ON FUNCTION public.get_org_id() TO authenticated;

-- Organizations
CREATE POLICY "org: member read"  ON organizations FOR SELECT
  USING (id = public.get_org_id());
CREATE POLICY "org: owner update" ON organizations FOR UPDATE
  USING (id = public.get_org_id())
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('owner','admin'));

-- Profiles
CREATE POLICY "profile: read org"   ON profiles FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "profile: update own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profile: insert own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Leads
CREATE POLICY "leads: select" ON leads FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "leads: insert" ON leads FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "leads: update" ON leads FOR UPDATE USING (org_id = public.get_org_id());
CREATE POLICY "leads: delete" ON leads FOR DELETE USING (org_id = public.get_org_id());

-- Followups
CREATE POLICY "fu: select" ON followups FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "fu: insert" ON followups FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "fu: update" ON followups FOR UPDATE USING (org_id = public.get_org_id());
CREATE POLICY "fu: delete" ON followups FOR DELETE USING (org_id = public.get_org_id());

-- Daily diary
CREATE POLICY "diary: select" ON daily_diary FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "diary: insert" ON daily_diary FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "diary: update" ON daily_diary FOR UPDATE USING (org_id = public.get_org_id());
CREATE POLICY "diary: delete" ON daily_diary FOR DELETE USING (org_id = public.get_org_id());

-- ─── MONTHLY SUMMARY VIEW ─────────────────────────────────
CREATE OR REPLACE VIEW monthly_summary WITH (security_invoker = true) AS
SELECT
  org_id, user_id,
  date_trunc('month', date)::date AS month,
  SUM(ce) AS total_ce, SUM(rm) AS total_rm,
  SUM(rr) AS total_rr, SUM(fr) AS total_fr,
  COUNT(*) AS days_recorded
FROM daily_diary
GROUP BY org_id, user_id, date_trunc('month', date);