<template>
  <div>
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
      Campos personalizados
    </div>
    <p style="font-size:12px;color:var(--text-3);margin:-8px 0 4px">
      Crie campos extras pra preencher no lead, alem dos campos padrao.
    </p>

    <!-- Lista -->
    <div v-if="defs.length" style="display:flex;flex-direction:column;gap:6px">
      <div v-for="d in defs" :key="d.id"
        style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px">
        <span style="font-size:13px;font-weight:500;color:var(--text-1)">{{ d.label }}</span>
        <span style="font-size:11px;color:var(--text-3);background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:1px 6px">{{ TYPE_LABEL[d.field_type] }}</span>
        <button @click="onRemove(d)"
          style="margin-left:auto;border:none;background:none;color:var(--text-3);cursor:pointer;font-size:12px;padding:2px 4px">
          Remover
        </button>
      </div>
    </div>
    <div v-else style="font-size:12px;color:var(--text-3);padding:6px 0">Nenhum campo personalizado ainda.</div>

    <!-- Novo campo -->
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;padding-top:12px;border-top:1px solid var(--border-soft)">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input v-model="form.label" placeholder="Nome do campo (ex: Setor)" style="flex:1;min-width:150px" maxlength="40" />
        <select v-model="form.field_type" style="width:auto;flex-shrink:0">
          <option value="text">Texto</option>
          <option value="number">Numero</option>
          <option value="date">Data</option>
          <option value="select">Selecao</option>
        </select>
      </div>
      <input v-if="form.field_type === 'select'" v-model="optionsRaw"
        placeholder="Opcoes separadas por virgula (ex: Quente, Morno, Frio)" />
      <button class="btn btn-primary" :disabled="saving || !form.label.trim()" @click="onCreate" style="align-self:flex-start">
        {{ saving ? 'Adicionando...' : 'Adicionar campo' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CustomFieldType, CustomFieldDef } from '~/types'

const { defs, load, create, remove } = useCustomFields()

const TYPE_LABEL: Record<string, string> = { text: 'Texto', number: 'Numero', date: 'Data', select: 'Selecao' }

const form = reactive<{ label: string; field_type: CustomFieldType }>({ label: '', field_type: 'text' })
const optionsRaw = ref('')
const saving = ref(false)

onMounted(() => load())

async function onCreate() {
  if (!form.label.trim()) return
  saving.value = true
  try {
    const options = form.field_type === 'select'
      ? optionsRaw.value.split(',').map(s => s.trim()).filter(Boolean)
      : undefined
    await create({ label: form.label.trim(), field_type: form.field_type, options })
    form.label = ''
    optionsRaw.value = ''
    form.field_type = 'text'
  } catch { /* silencioso */ }
  finally { saving.value = false }
}

async function onRemove(d: CustomFieldDef) {
  if (!confirm(`Remover o campo "${d.label}"? Os valores ja preenchidos deixam de aparecer.`)) return
  await remove(d.id)
}
</script>
