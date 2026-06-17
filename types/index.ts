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

export type LeadFonte = 'cold_call' | 'linkedin' | 'indicacao' | 'evento' | 'outro'
export type LeadPorte = 'micro' | 'pequena' | 'media' | 'grande'

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
  // Campos de qualificação (ICP)
  fonte: LeadFonte | null
  segmento: string | null
  cidade: string | null
  estado: string | null
  porte: LeadPorte | null
  // Proposta
  proposta_url: string | null
  // Cadencia
  cadence_id: string | null
  cadence_started_at: string | null
  // Perda / Forecast
  motivo_perda: string | null
  valor_estimado: number | null
  // Etiquetas
  tag_ids: string[]
  created_at: string
  updated_at: string
  followups?: Followup[]
}

export interface LeadEvent {
  id: string
  lead_id: string
  org_id: string
  user_id: string | null
  type: 'created' | 'status_change' | 'field_update' | 'followup' | 'note'
  payload: Record<string, unknown> | null
  created_at: string
  profiles?: { name: string | null; avatar_url: string | null } | null
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

// ─── Etiquetas (tags) ─────────────────────────────────────

export interface Tag {
  id: string
  org_id: string
  name: string
  color: string
  created_at: string
}

// ─── Metricas do funil (CE/RM/RR/FR/LD) ──────────────────

export type MetricKey = 'CE' | 'RM' | 'RR' | 'FR' | 'LD'

// ─── Cadences ─────────────────────────────────────────────

export type CadenceChannel = 'Ligacao' | 'Email' | 'LinkedIn' | 'WhatsApp' | 'Outro'

export interface CadenceStep {
  id: string
  cadence_id: string
  step_order: number
  day_offset: number
  channel: CadenceChannel
  instruction: string | null
  created_at: string
}

export interface Cadence {
  id: string
  org_id: string
  name: string
  description: string | null
  cadence_steps: CadenceStep[]
  created_at: string
  updated_at: string
}

// ─── Lead Notes ──────────────────────────────────────────

export interface LeadNote {
  id: string
  lead_id: string
  org_id: string
  user_id: string | null
  content: string
  created_at: string
  profiles?: { name: string | null } | null
}

// ─── Message Templates ────────────────────────────────────

export type TemplateChannel = 'WhatsApp' | 'Email' | 'Ligacao' | 'LinkedIn' | 'Outro'

export interface MessageTemplate {
  id: string
  org_id: string
  name: string
  channel: TemplateChannel
  content: string
  created_at: string
  updated_at: string
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
