// composables/useCardPrefs.ts
// Preferencia de quais campos aparecem no card/linha do lead (por usuario, localStorage).

export interface CardPrefs {
  company: boolean
  value: boolean
  returnDate: boolean
  score: boolean
  fu: boolean
  tags: boolean
}

const DEFAULTS: CardPrefs = {
  company: true, value: true, returnDate: true, score: true, fu: true, tags: true,
}

export const CARD_FIELDS: { key: keyof CardPrefs; label: string }[] = [
  { key: 'company',    label: 'Empresa' },
  { key: 'value',      label: 'Valor estimado' },
  { key: 'returnDate', label: 'Data de retorno' },
  { key: 'score',      label: 'Score ICP' },
  { key: 'fu',         label: 'Progresso de follow-up' },
  { key: 'tags',       label: 'Etiquetas' },
]

const STORAGE_KEY = 'pipeline-card-prefs'

export const useCardPrefs = () => {
  const prefs = useState<CardPrefs>('card-prefs', () => ({ ...DEFAULTS }))

  function init() {
    if (!import.meta.client) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try { prefs.value = { ...DEFAULTS, ...JSON.parse(raw) } } catch { /* ignore */ }
    }
  }

  function toggle(key: keyof CardPrefs) {
    prefs.value = { ...prefs.value, [key]: !prefs.value[key] }
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs.value))
  }

  return { prefs, init, toggle }
}
