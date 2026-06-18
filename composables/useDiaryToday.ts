// composables/useDiaryToday.ts
// Log rapido do diario do dia (CE/RM/RR/FR) com persistencia otimista e debounce.
// Usado no Follow-up para registrar metricas em 1 clique enquanto o BDR trabalha a fila.

import type { DiaryEntry } from '~/types'

type DiaryField = 'ce' | 'rm' | 'rr' | 'fr'

export const useDiaryToday = () => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const day      = reactive<Record<DiaryField, number>>({ ce: 0, rm: 0, rr: 0, fr: 0 })
  const loaded   = ref(false)
  const saving   = ref(false)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function load() {
    try {
      const now  = new Date()
      const rows = await $fetch<DiaryEntry[]>('/api/diary', {
        query: { month: String(now.getMonth() + 1), year: String(now.getFullYear()) },
      })
      const entry = (rows || []).find(e => e.date === todayStr)
      if (entry) { day.ce = entry.ce; day.rm = entry.rm; day.rr = entry.rr; day.fr = entry.fr }
    } catch { /* silencioso */ }
    finally { loaded.value = true }
  }

  function persist() {
    if (saveTimer) clearTimeout(saveTimer)
    saving.value = true
    saveTimer = setTimeout(async () => {
      try {
        await $fetch('/api/diary', { method: 'POST', body: { date: todayStr, ...day } })
      } finally {
        saving.value = false
      }
    }, 600)
  }

  function bump(field: DiaryField, delta: number) {
    const next = day[field] + delta
    if (next < 0 || next > 9999) return
    day[field] = next
    persist()
  }

  return { day, loaded, saving, load, bump }
}
