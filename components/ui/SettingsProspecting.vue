<template>
  <!-- Aba "Prospecção": exportar dados, etiquetas, templates de mensagem. -->
  <div v-if="profile?.role === 'owner'" class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Exportar dados
    </div>
    <p style="font-size:12px;color:var(--text-2);line-height:1.6;margin:0">
      Baixe todos os dados da sua organização (leads, follow-ups, diário e membros) em formato JSON.
    </p>
    <a :href="exportUrl" download class="btn" style="text-decoration:none;text-align:center">
      ↓ Exportar todos os dados
    </a>
  </div>

  <div class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      Etiquetas
      <span v-if="tags.length" class="badge">{{ tags.length }}</span>
    </div>

    <div v-if="tags.length" class="tag-mgr-list">
      <div v-for="t in tags" :key="t.id" class="tag-mgr-row">
        <input type="color" :value="t.color" @change="updTagColor(t, $event)" class="tag-mgr-color" title="Cor" />
        <input :value="t.name" @change="updTagName(t, $event)" class="input tag-mgr-name" maxlength="40" />
        <button @click="delTag(t)" class="tag-mgr-del" title="Excluir etiqueta">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
    <div v-else style="font-size:12px;color:var(--text-3);padding:4px 0">
      Nenhuma etiqueta criada. Use o campo abaixo para criar a primeira.
    </div>

    <div class="tag-mgr-create">
      <input type="color" v-model="newTagColor" class="tag-mgr-color" title="Cor" />
      <input v-model="newTagName" placeholder="Nova etiqueta..." class="input" maxlength="40" @keydown.enter="addTag" />
      <button class="btn btn-primary" :disabled="!newTagName.trim() || addingTag" @click="addTag" style="flex-shrink:0">
        {{ addingTag ? '...' : 'Criar' }}
      </button>
    </div>
  </div>

  <div class="card" style="grid-column:1/-1">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Templates de mensagem
      <span v-if="templates.length" class="badge">{{ templates.length }}</span>
    </div>

    <div v-if="templatesLoading" style="display:flex;flex-direction:column;gap:6px">
      <div v-for="i in 3" :key="i"
        style="height:44px;background:var(--bg);border-radius:8px;animation:pulse 1.5s infinite" />
    </div>

    <div v-else-if="templates.length" style="display:flex;flex-direction:column;gap:1px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <div v-for="tpl in templates" :key="tpl.id"
        style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border-soft);transition:background .08s"
        @mouseenter="hoveredTpl = tpl.id" @mouseleave="hoveredTpl = null"
        :style="{ background: hoveredTpl === tpl.id ? 'var(--bg)' : 'transparent' }">
        <span class="tpl-channel-tag" :class="'tpl-ch-' + tpl.channel.toLowerCase()">{{ tpl.channel }}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text-1)">{{ tpl.name }}</div>
          <div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">
            {{ tpl.content.slice(0, 80) }}{{ tpl.content.length > 80 ? '...' : '' }}
          </div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button @click="editTpl(tpl)"
            style="padding:3px 9px;font-size:11px;font-weight:500;border:1px solid var(--border);background:var(--surface);color:var(--text-2);border-radius:5px;cursor:pointer;font-family:inherit">
            Editar
          </button>
          <button @click="deleteTpl(tpl.id, tpl.name)"
            style="padding:3px 9px;font-size:11px;font-weight:500;border:1px solid var(--bad-bd);background:transparent;color:#dc2626;border-radius:5px;cursor:pointer;font-family:inherit">
            X
          </button>
        </div>
      </div>
    </div>
    <div v-else style="font-size:12px;color:var(--text-3);padding:4px 0">
      Nenhum template criado ainda. Use o formulario abaixo para criar o primeiro.
    </div>

    <div style="border-top:1px solid var(--border-soft);padding-top:16px">
      <div class="invite-title" style="margin-bottom:12px">
        {{ tplForm.editingId ? 'Editar template' : 'Novo template' }}
      </div>
      <div v-if="tplError" class="alert alert-error" style="margin-bottom:10px">{{ tplError }}</div>
      <form @submit.prevent="saveTpl" class="form">
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
          <div class="field">
            <label class="label">Nome</label>
            <input v-model="tplForm.name" required maxlength="80" placeholder="Ex: Primeiro contato WhatsApp" class="input" />
          </div>
          <div class="field">
            <label class="label">Canal</label>
            <select v-model="tplForm.channel" class="select" style="width:auto">
              <option v-for="ch in TPL_CHANNELS" :key="ch" :value="ch">{{ ch }}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="label">Conteudo</label>
          <textarea v-model="tplForm.content" required rows="4" maxlength="2000"
            placeholder="Oi [nome], tudo bem?..." class="input" style="resize:vertical;min-height:80px" />
          <div style="font-size:10px;color:var(--text-3);margin-top:3px;text-align:right">
            {{ tplForm.content.length }}/2000
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button type="submit" class="btn btn-primary" :disabled="savingTpl" style="flex:1">
            <span v-if="savingTpl" class="spinner"></span>
            {{ savingTpl ? 'Salvando...' : (tplForm.editingId ? 'Atualizar template' : 'Criar template') }}
          </button>
          <button v-if="tplForm.editingId" type="button" class="btn" @click="cancelEditTpl" style="flex:0 0 auto">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MessageTemplate } from '~/types'

const emit = defineEmits<{ notify: [msg: string] }>()

const { profile } = useProfile()
const exportUrl = '/api/export/full'

// ── Etiquetas ──────────────────────────────────────────────────────────
const { tags, fetchTags, createTag, updateTag, deleteTag } = useTags()
const newTagName  = ref('')
const newTagColor = ref('#2563eb')
const addingTag   = ref(false)

async function addTag() {
  if (!newTagName.value.trim()) return
  addingTag.value = true
  try { await createTag(newTagName.value.trim(), newTagColor.value); newTagName.value = ''; emit('notify', 'Etiqueta criada!') }
  catch (e: any) { emit('notify', e?.data?.message || 'Erro ao criar etiqueta.') }
  finally { addingTag.value = false }
}
function updTagName(t: { id: string; name: string }, e: Event) {
  const v = (e.target as HTMLInputElement).value.trim()
  if (v && v !== t.name) updateTag(t.id, { name: v }).catch(() => emit('notify', 'Erro ao renomear.'))
}
function updTagColor(t: { id: string }, e: Event) {
  updateTag(t.id, { color: (e.target as HTMLInputElement).value }).catch(() => emit('notify', 'Erro ao mudar cor.'))
}
async function delTag(t: { id: string; name: string }) {
  if (!confirm(`Excluir a etiqueta "${t.name}"? Ela some dos leads que a usam.`)) return
  try { await deleteTag(t.id); emit('notify', 'Etiqueta excluida.') }
  catch { emit('notify', 'Erro ao excluir.') }
}

// ── Templates de mensagem ──────────────────────────────────────────────
const TPL_CHANNELS = ['WhatsApp', 'Email', 'Ligação', 'LinkedIn', 'Outro'] as const
const templates        = ref<MessageTemplate[]>([])
const templatesLoading = ref(false)
const hoveredTpl       = ref<string | null>(null)
const savingTpl        = ref(false)
const tplError         = ref<string | null>(null)
const tplForm = reactive({ name: '', channel: 'WhatsApp' as string, content: '', editingId: '' })

async function loadTemplates() {
  templatesLoading.value = true
  try {
    templates.value = await $fetch<MessageTemplate[]>('/api/templates')
  } catch {
    // silently ignore
  } finally {
    templatesLoading.value = false
  }
}

function editTpl(tpl: MessageTemplate) {
  tplForm.name      = tpl.name
  tplForm.channel   = tpl.channel
  tplForm.content   = tpl.content
  tplForm.editingId = tpl.id
  tplError.value    = null
}

function cancelEditTpl() {
  tplForm.name      = ''
  tplForm.channel   = 'WhatsApp'
  tplForm.content   = ''
  tplForm.editingId = ''
  tplError.value    = null
}

async function saveTpl() {
  savingTpl.value = true
  tplError.value  = null
  try {
    const isEdit = !!tplForm.editingId
    if (isEdit) {
      const updated = await $fetch<MessageTemplate>(`/api/templates/${tplForm.editingId}`, {
        method: 'PATCH',
        body: { name: tplForm.name, channel: tplForm.channel, content: tplForm.content },
      })
      const idx = templates.value.findIndex(t => t.id === tplForm.editingId)
      if (idx !== -1) templates.value[idx] = updated
    } else {
      const created = await $fetch<MessageTemplate>('/api/templates', {
        method: 'POST',
        body: { name: tplForm.name, channel: tplForm.channel, content: tplForm.content },
      })
      templates.value.push(created)
    }
    cancelEditTpl()
    emit('notify', isEdit ? 'Template atualizado!' : 'Template criado!')
  } catch (e: any) {
    tplError.value = e?.data?.message || e?.message || 'Erro ao salvar template.'
  } finally {
    savingTpl.value = false
  }
}

async function deleteTpl(id: string, name: string) {
  if (!confirm(`Excluir o template "${name}"? Esta acao e irreversivel.`)) return
  try {
    await $fetch(`/api/templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(t => t.id !== id)
    emit('notify', 'Template excluido.')
  } catch (e: any) {
    emit('notify', e?.data?.message || 'Erro ao excluir template.')
  }
}

onMounted(() => {
  loadTemplates()
  fetchTags()
})
</script>

<style scoped>
.tag-mgr-list { display:flex;flex-direction:column;gap:6px;margin-bottom:12px }
.tag-mgr-row { display:flex;align-items:center;gap:8px }
.tag-mgr-color { width:32px;height:32px;padding:0;border:1px solid var(--border);border-radius:7px;background:none;cursor:pointer;flex-shrink:0 }
.tag-mgr-name { flex:1 }
.tag-mgr-del { width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--danger-bdr);background:transparent;color:var(--danger);border-radius:7px;cursor:pointer }
.tag-mgr-del:hover { background:var(--danger-bg) }
.tag-mgr-create { display:flex;align-items:center;gap:8px;border-top:1px solid var(--border-soft);padding-top:12px }

.tpl-channel-tag { font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;flex-shrink:0;letter-spacing:.03em }
.tpl-ch-whatsapp { background:var(--ok-bg);color:var(--ok) }
.tpl-ch-email    { background:var(--info-bg);color:var(--info) }
.tpl-ch-ligação  { background:var(--warn-bg);color:var(--warn) }
.tpl-ch-linkedin { background:var(--info-bg);color:#3730a3 }
.tpl-ch-outro    { background:var(--bg);color:var(--text-3);border:1px solid var(--border) }
</style>
