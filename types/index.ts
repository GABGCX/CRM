// ─── Organization / Tenant ───────────────────────────────

export interface OrgTheme {
  primary_color: string
  accent_color: string
  logo_url: string | null
  favicon_url: string | null
  product_name: string
}

export interface OrgSettings {
  ticket_medio: number
  meta_mensal: number
  timezone: string
}

export interface Organization {
  id: string
  slug: string
  name: string
  custom_domain: string | null
  plan: 'free' | 'pro' | 'enterprise'
  theme: OrgTheme
  settings: OrgSettings
  created_at: string
  updated_at: string
}

// ─── Profile ─────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'bdr'

export interface Profile {
  email: string
  id: string
  org_id: string
  name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ─── Leads ───────────────────────────────────────────────

export type LeadStatus =
  | 'Aguardando retorno'
  | 'Follow-up'
  | 'De molho'
  | 'Reunião agendada'
  | 'Enviar proposta'
  | 'Proposta enviada'
  | 'Fechado'
  | 'Recusado'
  | 'Sem interesse'
  | 'Não atende'

export interface Lead {
  id: string
  org_id: string
  owner_id: string
  decisor: string
  telefone: string | null
  negocio: string | null
  instagram: string | null
  num_vendedores: number | null
  nome_ponte: string | null
  resultado: LeadStatus
  data_retorno: string | null
  reuniao_agendada: boolean
  turno: string | null
  horario: string | null
  info: string | null
  created_at: string
  updated_at: string
  followups?: Followup[]
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'followups'>
export type LeadUpdate = Partial<LeadInsert>

// ─── Followups ───────────────────────────────────────────

export interface Followup {
  id: string
  lead_id: string
  org_id: string
  attempt_index: number
  completed_at: string | null
}

// ─── Diary ───────────────────────────────────────────────

export interface DiaryEntry {
  id: string
  org_id: string
  user_id: string
  date: string
  ce: number
  rm: number
  rr: number
  fr: number
  created_at: string
  updated_at: string
}

// ─── Monthly Summary (view) ───────────────────────────────

export interface MonthlySummary {
  org_id: string
  user_id: string
  month: string
  total_ce: number
  total_rm: number
  total_rr: number
  total_fr: number
  days_recorded: number
}

// ─── API responses ────────────────────────────────────────

export interface ApiResponse<T = null> {
  data: T | null
  error: string | null
}

// ─── Tenant context ───────────────────────────────────────

export interface TenantContext {
  org: Organization
  subdomain: string
}
