// utils/leadDomain.ts
// Fonte unica de verdade para regras de dominio de leads:
// status, estagio do funil, urgencia, cores, cadencia e formatacao.
// Importado por paginas e componentes para eliminar duplicacao.

import type { Lead, LeadStatus, Followup } from '~/types'
export { calcLeadScore, leadScoreLabel, leadScoreColor, leadScoreBg } from '~/utils/leadScore'

type LeadLike = Lead & { followups?: Followup[] }

// ── Status ──────────────────────────────────────────────────────────────
export const STATUSES: LeadStatus[] = [
  'Novo', 'Prospecção', 'Qualificação',
  'Aguardando retorno', 'Follow-up', 'De molho', 'Reunião agendada',
  'Enviar proposta', 'Proposta enviada', 'Fechado', 'Recusado', 'Sem interesse', 'Não atende',
]

// Status que tiram o lead do funil ativo
export const TERMINAL_STATUSES: LeadStatus[] = ['Fechado', 'Recusado', 'Sem interesse']
// Status de perda (abrem modal de motivo)
export const LOSS_STATUSES: LeadStatus[] = ['Recusado', 'Sem interesse']
// Status "quentes" para previsao de receita
export const HOT_STATUSES: LeadStatus[] = ['Reunião agendada', 'Proposta enviada', 'Enviar proposta']

export const isActive   = (l: Pick<Lead, 'resultado'>) => !TERMINAL_STATUSES.includes(l.resultado)
export const isHot      = (l: Pick<Lead, 'resultado'>) => HOT_STATUSES.includes(l.resultado)

// Probabilidade de fechamento por estagio (previsao ponderada)
export const STAGE_PROBABILITY: Record<string, number> = {
  'Novo': 0.02, 'Prospecção': 0.05, 'Qualificação': 0.08,
  'Aguardando retorno': 0.10, 'Follow-up': 0.15, 'De molho': 0.05, 'Não atende': 0.05,
  'Reunião agendada': 0.40, 'Enviar proposta': 0.55, 'Proposta enviada': 0.70,
}

// ── Follow-up ───────────────────────────────────────────────────────────
export const FU_DAYS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
export const FU_TOTAL = FU_DAYS.length

export const fuDone   = (l: LeadLike) => (l.followups || []).filter(f => f.completed_at).length
export const sortedFU = (fus?: Followup[]) => [...(fus || [])].sort((a, b) => a.attempt_index - b.attempt_index)

// ── Tempo / urgencia ────────────────────────────────────────────────────
export type Urgency = 'overdue' | 'today' | 'soon' | 'none'

export function daysUntil(date: string | null): number | null {
  if (!date) return null
  const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.floor((new Date(date).getTime() - t.getTime()) / 86_400_000)
}

export function daysIn(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
}

// Urgencia do retorno: vencido / hoje / proximos 3 dias / nenhum
export function leadUrgency(l: Pick<Lead, 'data_retorno' | 'resultado'>): Urgency {
  if (!l.data_retorno || !isActive(l)) return 'none'
  const d = daysUntil(l.data_retorno)
  if (d === null) return 'none'
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d <= 3) return 'soon'
  return 'none'
}

export const isOverdue = (l: Pick<Lead, 'data_retorno' | 'resultado'>) => leadUrgency(l) === 'overdue'

// Cores por urgencia (barra/avatar) — tokens Carbon, adaptam ao dark mode
export const URGENCY_COLOR: Record<Urgency, string> = {
  overdue: 'var(--bad)', today: 'var(--warn)', soon: 'var(--accent)', none: 'var(--border)',
}
export const URGENCY_AVATAR: Record<Urgency, { bg: string; fg: string }> = {
  overdue: { bg: 'var(--bad-bg)',     fg: 'var(--bad)' },
  today:   { bg: 'var(--warn-bg)',    fg: 'var(--warn)' },
  soon:    { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  none:    { bg: 'var(--bg-subtle)',  fg: 'var(--text-2)' },
}

// ── Estagio do funil ────────────────────────────────────────────────────
export const FUNNEL_STAGES = [
  { key: 'contato',    label: 'Contato' },
  { key: 'reuniao',    label: 'Reunião' },
  { key: 'proposta',   label: 'Proposta' },
  { key: 'negociacao', label: 'Negociação' },
  { key: 'fechado',    label: 'Fechado' },
] as const

const STATUS_TO_STAGE: Record<string, number> = {
  'Novo': 0, 'Prospecção': 0, 'Qualificação': 0,
  'Aguardando retorno': 0, 'Follow-up': 0, 'De molho': 0, 'Não atende': 0,
  'Reunião agendada': 1,
  'Enviar proposta': 2, 'Proposta enviada': 2, 'Sem interesse': 2, 'Recusado': 2,
  'Fechado': 4,
}
export const funnelStageOf = (resultado: string): number => STATUS_TO_STAGE[resultado] ?? 0
const LOST_FOR_FUNNEL = ['Recusado', 'Sem interesse', 'Não atende']

export function funnelStageColor(resultado: string, idx: number): string {
  const cur  = funnelStageOf(resultado)
  const lost = LOST_FOR_FUNNEL.includes(resultado)
  if (lost && idx === cur) return 'var(--bad)'
  if (idx < cur)  return 'var(--accent)'
  if (idx === cur) return 'var(--text-1)'
  return 'var(--border)'
}
export const funnelStagePassed = (resultado: string, idx: number) => idx < funnelStageOf(resultado)

// ── Cores e icones de status ────────────────────────────────────────────
const STATUS_TAG: Record<string, string> = {
  'Novo': 'tag-gray', 'Prospecção': 'tag-indigo', 'Qualificação': 'tag-teal',
  'Aguardando retorno': 'tag-amber', 'Follow-up': 'tag-blue', 'De molho': 'tag-purple',
  'Reunião agendada': 'tag-teal', 'Enviar proposta': 'tag-amber', 'Proposta enviada': 'tag-blue',
  'Fechado': 'tag-green', 'Recusado': 'tag-red', 'Sem interesse': 'tag-gray', 'Não atende': 'tag-gray',
}
export const statusTagClass = (s: string) => STATUS_TAG[s] || 'tag-gray'

const STATUS_ICON: Record<string, string> = {
  'Novo':               '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  'Prospecção':         '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'Qualificação':       '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  'Aguardando retorno': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'Follow-up':          '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-9.49"/>',
  'De molho':           '<circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/>',
  'Reunião agendada':   '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  'Enviar proposta':    '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  'Proposta enviada':   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  'Fechado':            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'Recusado':           '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'Sem interesse':      '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>',
  'Não atende':         '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.5 16.5a14.4 14.4 0 01-4 4l-3-3-5 1-1-5 3-5a14.4 14.4 0 01-.5-1.5"/>',
}
export const statusIconHtml = (s: string) => STATUS_ICON[s] || ''

// ── Fonte ───────────────────────────────────────────────────────────────
export const FONTE_LABEL: Record<string, string> = {
  cold_call: 'Cold Call', linkedin: 'LinkedIn', indicacao: 'Indicação', evento: 'Evento', outro: 'Outro',
}

// ── Formatacao de dinheiro ──────────────────────────────────────────────
export const fmtMoney = (v: number) => v.toLocaleString('pt-BR')
export const fmtK = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : String(v)

// ── Telefone / WhatsApp ─────────────────────────────────────────────────
export const telHref = (phone: string | null) => phone ? `tel:${phone}` : undefined
export const waHref  = (phone: string | null) => phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : undefined
