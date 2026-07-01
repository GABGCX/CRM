// composables/useSavedViews.ts
// Visoes salvas: snapshots nomeados de um conjunto de filtros, por usuario,
// persistidos em localStorage. Generico no formato dos filtros (T) e isolado
// por namespace (ex.: 'pipeline'), pra reuso em outras telas no futuro.

import type { Ref } from 'vue'

export interface SavedView<T> {
  id: string
  name: string
  filters: T
}

export function useSavedViews<T extends Record<string, unknown>>(namespace: string) {
  const storageKey = `saved-views:${namespace}`
  // Cast explicito: ref<...>() com T generico deriva UnwrapRef e quebra a
  // atribuicao (TS2322). Fixamos o tipo do ref manualmente.
  const views = ref<SavedView<T>[]>([]) as Ref<SavedView<T>[]>

  function load() {
    if (typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(storageKey)
      views.value = raw ? JSON.parse(raw) : []
    } catch {
      views.value = []
    }
  }

  function persist() {
    if (typeof localStorage === 'undefined') return
    try { localStorage.setItem(storageKey, JSON.stringify(views.value)) } catch { /* cota/cego */ }
  }

  function genId() {
    try { return crypto.randomUUID() } catch { return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
  }

  function save(name: string, filters: T): SavedView<T> {
    const view: SavedView<T> = { id: genId(), name: name.trim(), filters: JSON.parse(JSON.stringify(filters)) }
    views.value = [...views.value, view]
    persist()
    return view
  }

  function remove(id: string) {
    views.value = views.value.filter(v => v.id !== id)
    persist()
  }

  function rename(id: string, name: string) {
    const v = views.value.find(v => v.id === id)
    if (v) { v.name = name.trim(); persist() }
  }

  // Compara dois conjuntos de filtros (igualdade rasa por JSON) pra marcar a visao ativa.
  function matches(filters: T, view: SavedView<T>): boolean {
    return JSON.stringify(filters) === JSON.stringify(view.filters)
  }

  return { views, load, save, remove, rename, matches }
}
