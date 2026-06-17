// composables/useTags.ts
// Estado global das etiquetas (tags) da organizacao + CRUD.

import type { Tag } from '~/types'

export const useTags = () => {
  const tags   = useState<Tag[]>('tags', () => [])
  const loaded = useState<boolean>('tags-loaded', () => false)

  async function fetchTags(force = false) {
    if (loaded.value && !force) return
    try {
      tags.value  = await $fetch<Tag[]>('/api/tags')
      loaded.value = true
    } catch { /* silencioso */ }
  }

  async function createTag(name: string, color: string) {
    const t = await $fetch<Tag>('/api/tags', { method: 'POST', body: { name, color } })
    tags.value = [...tags.value, t].sort((a, b) => a.name.localeCompare(b.name))
    return t
  }

  async function updateTag(id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) {
    const t = await $fetch<Tag>(`/api/tags/${id}`, { method: 'PATCH', body: patch })
    const i = tags.value.findIndex(x => x.id === id)
    if (i >= 0) tags.value[i] = t
    return t
  }

  async function deleteTag(id: string) {
    await $fetch(`/api/tags/${id}`, { method: 'DELETE' })
    tags.value = tags.value.filter(t => t.id !== id)
  }

  const tagsById = computed(() =>
    Object.fromEntries(tags.value.map(t => [t.id, t])) as Record<string, Tag>
  )

  // Resolve uma lista de ids para os objetos Tag (ignora orfaos).
  function resolve(ids: string[] | null | undefined): Tag[] {
    if (!ids?.length) return []
    return ids.map(id => tagsById.value[id]).filter(Boolean)
  }

  return { tags, loaded, fetchTags, createTag, updateTag, deleteTag, tagsById, resolve }
}

// Paleta de cores sugeridas para novas tags
export const TAG_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488',
  '#2563eb', '#7c3aed', '#db2777', '#64748b', '#0891b2',
]
