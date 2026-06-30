// composables/useDiaryToday.ts
// Log rapido do diario do dia (LD/CE/RM/RR/FR) com persistencia otimista e debounce.
// Estado e SINGLETON (useState) pra ser compartilhado entre a barra de registro do
// Follow-up e as acoes rapidas no hover das linhas de lead (Pipeline/Follow-up).

import type { DiaryEntry } from '~/types'
import { localDateISO } from '~/utils/leadDomain'

type DiaryField = 'ld' | 'ce' | 'rm' | 'rr' | 'fr'

export const useDiaryToday = () => {
  const todayStr = localDateISO()
  const day    = useState<Record<DiaryField, number>>('diary-today', () => ({ ld: 0, ce: 0, rm: 0, rr: 0, fr: 0 }))
  const loaded = useState<boolean>('diary-today-loaded', () => false)
  const saving = useState<boolean>('diary-today-saving', () => false)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function load(force = false) {
    if (loaded.value && !force) return
    try {
      const now  = new Date()
      const rows = await $fetch<DiaryEntry[]>('/api/diary', {
        query: { month: String(now.getMonth() + 1), year: String(now.getFullYear()) },
      })
      const entry = (rows || []).find(e => e.date === todayStr)
      if (entry) day.value = { ld: entry.ld ?? 0, ce: entry.ce, rm: entry.rm, rr: entry.rr, fr: entry.fr }
    } catch { /* silencioso */ }
    finally { loaded.value = true }
  }

  function persist() {
    if (saveTimer) clearTimeout(saveTimer)
    saving.value = true
    saveTimer = setTimeout(async () => {
      try {
        await $fetch('/api/diary', { method: 'POST', body: { date: todayStr, ...day.value } })
      } finally {
        saving.value = false
      }
    }, 600)
  }

  // Garante os valores atuais do dia antes de incrementar (senao sobrescreveria com zeros).
  async function bump(field: DiaryField, delta: number) {
    if (!loaded.value) await load()
    const next = day.value[field] + delta
    if (next < 0 || next > 9999) return
    day.value = { ...day.value, [field]: next }
    persist()
  }

  return { day, loaded, saving, load, bump }
}
