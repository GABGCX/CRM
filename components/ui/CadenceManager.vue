<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div class="card-label" style="margin-bottom:0">Cadencias</div>
      <button class="btn" style="font-size:11px" @click="openNew">+ Nova cadencia</button>
    </div>

    <!-- Lista de cadencias -->
    <div v-if="loading" style="color:#94a3b8;font-size:12px;padding:16px 0">Carregando...</div>
    <div v-else-if="!cadences.length" style="color:#94a3b8;font-size:12px;padding:16px 0;text-align:center">
      Nenhuma cadencia criada.<br>Crie uma para atribuir a seus leads.
    </div>
    <div v-else style="display:flex;flex-direction:column;gap:6px">
      <div v-for="c in cadences" :key="c.id"
        style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;background:#f9f6ef">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div>
            <div style="font-size:13px;font-weight:600;color:#282828">{{ c.name }}</div>
            <div v-if="c.description" style="font-size:11px;color:#64748b;margin-top:2px">{{ c.description }}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn" style="font-size:11px;padding:3px 8px" @click="openEdit(c)">Editar</button>
            <button class="btn" style="font-size:11px;padding:3px 8px;color:#dc2626;border-color:#fecaca"
              @click="remove(c.id)">Remover</button>
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <span v-for="s in c.cadence_steps" :key="s.id"
            style="font-size:10px;padding:2px 8px;border-radius:99px;background:#eaefff;color:#0f2480;border:1px solid #b8cafd;display:inline-flex;align-items:center;gap:3px">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" v-html="channelIconHtml(s.channel)" />
            Dia {{ s.day_offset }}: {{ s.channel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal de criacao/edicao -->
    <Teleport to="body">
      <div v-if="modalOpen"
        style="position:fixed;inset:0;background:rgba(40,40,40,.6);backdrop-filter:blur(2px);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px"
        @click.self="modalOpen = false">
        <div class="card" style="width:100%;max-width:520px;max-height:90vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:15px;font-weight:600">{{ editing ? 'Editar cadencia' : 'Nova cadencia' }}</div>
            <button class="btn" @click="modalOpen = false" style="padding:4px 8px">X</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
            <div>
              <div class="input-label" style="margin-bottom:4px">Nome *</div>
              <input v-model="form.name" placeholder="Ex: Cold Call 10 tentativas" />
            </div>
            <div>
              <div class="input-label" style="margin-bottom:4px">Descricao</div>
              <input v-model="form.description" placeholder="Descricao opcional" />
            </div>
          </div>

          <!-- Steps -->
          <div style="font-size:12px;font-weight:600;margin-bottom:8px">Passos da cadencia</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
            <div v-for="(s, i) in form.steps" :key="i"
              style="display:grid;grid-template-columns:70px 1fr 1fr auto;gap:6px;align-items:start">
              <div>
                <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Dia</div>
                <input type="number" v-model.number="s.day_offset" min="0" style="font-size:12px;text-align:center" />
              </div>
              <div>
                <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Canal</div>
                <div style="display:flex;gap:3px;flex-wrap:wrap">
                  <button
                    v-for="ch in CHANNELS" :key="ch"
                    type="button"
                    @click="s.channel = ch as CadenceChannel"
                    style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 7px;border-radius:7px;border:1px solid;cursor:pointer;font-family:inherit;font-size:9px;font-weight:500;transition:all .1s"
                    :style="s.channel === ch
                      ? 'background:#eaefff;border-color:#193497;color:#193497'
                      : 'background:#f9f6ef;border-color:#e2e8f0;color:#64748b'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="channelIconHtml(ch)" />
                    {{ CHANNEL_LABEL[ch] }}
                  </button>
                </div>
              </div>
              <div>
                <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">Instrucao (opcional)</div>
                <input v-model="s.instruction" placeholder="O que fazer neste passo" style="font-size:12px" />
              </div>
              <button @click="removeStep(i)"
                style="border:none;background:none;color:#cbd5e1;cursor:pointer;font-size:13px;padding:4px;margin-top:14px"
                onmouseenter="this.style.color='#dc2626'"
                onmouseleave="this.style.color='#cbd5e1'">X</button>
            </div>
          </div>
          <button class="btn" style="font-size:11px;margin-bottom:16px" @click="addStep">+ Adicionar passo</button>

          <div v-if="formError" style="font-size:12px;color:#dc2626;margin-bottom:10px">{{ formError }}</div>

          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button class="btn" @click="modalOpen = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? 'Salvando...' : editing ? 'Salvar alteracoes' : 'Criar cadencia' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Cadence, CadenceChannel } from '~/types'

const CHANNELS: CadenceChannel[] = ['Ligacao', 'Email', 'LinkedIn', 'WhatsApp', 'Outro']

const CHANNEL_ICON: Record<string, string> = {
  'Ligacao':   '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z"/>',
  'Email':     '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  'LinkedIn':  '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  'WhatsApp':  '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
  'Outro':     '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
}
function channelIconHtml(ch: string): string { return CHANNEL_ICON[ch] || '' }
const CHANNEL_LABEL: Record<string, string> = {
  'Ligacao': 'Ligacao', 'Email': 'Email', 'LinkedIn': 'LinkedIn', 'WhatsApp': 'WhatsApp', 'Outro': 'Outro',
}

const cadences  = ref<Cadence[]>([])
const loading   = ref(false)
const modalOpen = ref(false)
const saving    = ref(false)
const formError = ref<string | null>(null)
const editing   = ref<Cadence | null>(null)

const form = reactive({
  name: '',
  description: '',
  steps: [] as { day_offset: number; channel: CadenceChannel; instruction: string }[],
})

async function load() {
  loading.value = true
  try {
    cadences.value = await $fetch<Cadence[]>('/api/cadences')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openNew() {
  editing.value      = null
  form.name          = ''
  form.description   = ''
  form.steps         = [{ day_offset: 1, channel: 'Ligacao', instruction: '' }]
  formError.value    = null
  modalOpen.value    = true
}

function openEdit(c: Cadence) {
  editing.value    = c
  form.name        = c.name
  form.description = c.description || ''
  form.steps       = c.cadence_steps.map(s => ({
    day_offset:  s.day_offset,
    channel:     s.channel,
    instruction: s.instruction || '',
  }))
  formError.value  = null
  modalOpen.value  = true
}

function addStep() {
  const lastDay = form.steps.at(-1)?.day_offset ?? 0
  form.steps.push({ day_offset: lastDay + 2, channel: 'Ligacao', instruction: '' })
}

function removeStep(i: number) {
  form.steps.splice(i, 1)
}

async function save() {
  formError.value = null
  if (!form.name.trim()) { formError.value = 'Nome obrigatorio.'; return }
  if (!form.steps.length) { formError.value = 'Adicione ao menos um passo.'; return }

  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/cadences/${editing.value.id}`, {
        method: 'PATCH',
        body: { name: form.name, description: form.description, steps: form.steps },
      })
    } else {
      await $fetch('/api/cadences', {
        method: 'POST',
        body: { name: form.name, description: form.description, steps: form.steps },
      })
    }
    await load()
    modalOpen.value = false
  } catch (e: any) {
    formError.value = e?.data?.message || 'Erro ao salvar.'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('Remover esta cadencia? Os leads associados perderao a referencia.')) return
  try {
    await $fetch(`/api/cadences/${id}`, { method: 'DELETE' })
    cadences.value = cadences.value.filter(c => c.id !== id)
  } catch (e: any) {
    alert(e?.data?.message || 'Erro ao remover.')
  }
}
</script>
