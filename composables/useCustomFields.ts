// composables/useCustomFields.ts
// Definicoes de campos personalizados da org (singleton via useState).

import type { CustomFieldDef, CustomFieldType } from '~/types'

export const useCustomFields = () => {
  const defs   = useState<CustomFieldDef[]>('custom-field-defs', () => [])
  const loaded = useState<boolean>('custom-field-defs-loaded', () => false)

  async function load(force = false) {
    if (loaded.value && !force) return
    try { defs.value = await $fetch<CustomFieldDef[]>('/api/custom-fields') } catch { /* silencioso */ }
    finally { loaded.value = true }
  }

  async function create(input: { label: string; field_type: CustomFieldType; options?: string[] }) {
    const d = await $fetch<CustomFieldDef>('/api/custom-fields', { method: 'POST', body: input })
    defs.value = [...defs.value, d]
    return d
  }

  async function remove(id: string) {
    await $fetch(`/api/custom-fields/${id}`, { method: 'DELETE' })
    defs.value = defs.value.filter(d => d.id !== id)
  }

  return { defs, loaded, load, create, remove }
}
