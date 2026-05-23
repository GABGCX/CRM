<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div class="page-title">Pipeline</div>
        <div class="page-sub">{{ totalLeads }} leads · {{ activeLeads }} ativos</div>
      </div>
      <button class="btn btn-primary" @click="showModal = true">+ Novo lead</button>
    </div>

    <!-- Status bar -->
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
      <button
        v-for="s in ['Todos', ...STATUSES]" :key="s"
        @click="filterStatus = s"
        :class="filterStatus === s ? 'btn btn-primary' : 'btn'"
        style="font-size:11px;padding:4px 10px">
        {{ s }}
        <span style="opacity:.6;margin-left:2px">{{ s === 'Todos' ? totalLeads : (countByStatus[s]||0) }}</span>
      </button>
    </div>

    <!-- Search -->
    <input v-model="searchQ" placeholder="Buscar por nome, empresa ou telefone..." style="margin-bottom:12px;max-width:320px" />

    <!-- Grid -->
    <div :style="{ display:'grid', gap:'12px', gridTemplateColumns: selectedLead ? '300px 1fr' : '1fr' }">
      <!-- List -->
      <div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:calc(100vh - 260px)">
        <div v-if="!filtered.length" style="text-align:center;padding:32px;color:#a3a3a3;font-size:13px">
          Nenhum lead encontrado.
        </div>
        <div v-for="l in filtered" :key="l.id"
          @click="selectLead(l)"
          style="border:1px solid #f0f0f0;border-radius:8px;padding:10px 12px;cursor:pointer;background:#fff;transition:all .1s"
          :style="{ borderColor: selectedId===l.id ? '#0a0a0a' : '#f0f0f0' }"
          onmouseenter="if(!this.classList.contains('sel')) this.style.borderColor='#e5e5e5'"
          onmouseleave="if(!this.classList.contains('sel')) this.style.borderColor='#f0f0f0'">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">
            <div style="min-width:0;flex:1">
              <div style="font-size:13px;font-weight:500;color:#0a0a0a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ l.decisor || 'Sem nome' }}</div>
              <div style="font-size:11px;color:#737373;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ l.negocio || '—' }}</div>
            </div>
            <span class="tag" :class="statusTagClass(l.resultado)" style="margin-left:8px;flex-shrink:0">{{ l.resultado }}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;gap:2px;align-items:center">
              <div v-for="fu in sortedFU(l.followups)" :key="fu.attempt_index"
                class="fu-dot" :class="fu.completed_at ? 'fu-dot-done' : 'fu-dot-todo'"></div>
            </div>
            <div style="font-size:10px;color:#a3a3a3;display:flex;gap:8px">
              <span v-if="isVencido(l)" style="color:#dc2626">vencido</span>
              <span>{{ fuDone(l) }}/10</span>
              <span>{{ daysIn(l.created_at) }}d</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail -->
      <div v-if="selectedLead" class="card" style="overflow-y:auto;max-height:calc(100vh - 260px)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-size:15px;font-weight:600;color:#0a0a0a">{{ selectedLead.decisor }}</div>
            <div style="font-size:12px;color:#737373">{{ selectedLead.negocio }} · {{ daysIn(selectedLead.created_at) }} dias no funil</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-danger" @click="removeLead(selectedLead.id)" style="font-size:11px;padding:5px 8px">
              <i class="ti ti-trash" aria-hidden="true"></i>
            </button>
            <button class="btn" @click="selectedId=null" style="font-size:11px;padding:5px 8px">✕</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div v-for="f in detailFields" :key="f.key" :style="{ gridColumn: f.wide ? 'span 2' : 'span 1' }">
            <div style="font-size:11px;color:#737373;margin-bottom:3px">{{ f.label }}</div>
            <input v-if="f.type !== 'select' && f.type !== 'textarea'" :type="f.type||'text'" v-model="editForm[f.key]" />
            <select v-else-if="f.type==='select'" v-model="editForm[f.key]">
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
            <textarea v-else v-model="editForm[f.key]" rows="2"></textarea>
          </div>
          <div style="grid-column:span 2;display:flex;align-items:center;gap:6px">
            <input type="checkbox" v-model="editForm.reuniao_agendada" id="reun" />
            <label for="reun" style="font-size:12px;color:#525252;cursor:pointer">Reunião agendada</label>
          </div>
        </div>

        <button class="btn btn-primary" :disabled="detailSaving" @click="saveLead" style="width:100%;justify-content:center;margin-bottom:14px">
          {{ detailSaving ? 'Salvando...' : 'Salvar alterações' }}
        </button>

        <div class="divider"></div>
        <div style="font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Follow-ups · {{ fuDone(selectedLead) }}/10</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">
          <button v-for="fu in sortedFU(selectedLead.followups)" :key="fu.attempt_index"
            @click="toggleFU(selectedLead, fu.attempt_index)"
            style="border-radius:6px;padding:7px 4px;text-align:center;cursor:pointer;border:1px solid;transition:all .1s;font-family:inherit"
            :style="fu.completed_at
              ? 'background:#f0fdf4;border-color:#bbf7d0;'
              : 'background:#f9f9f9;border-color:#f0f0f0;'">
            <div style="font-size:11px;font-weight:500" :style="{ color: fu.completed_at ? '#16a34a' : '#525252' }">{{ fu.attempt_index+1 }}º</div>
            <div style="font-size:10px;color:#a3a3a3">{{ FU_DAYS[fu.attempt_index] }}d</div>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="fade">
      <div v-if="showModal" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px" @click.self="showModal=false">
        <div class="card" style="width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:15px;font-weight:600">Novo lead</div>
            <button class="btn" @click="showModal=false" style="padding:4px 8px">✕</button>
          </div>
          <div v-if="createError" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:12px;padding:8px 10px;border-radius:6px;margin-bottom:10px">{{ createError }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Nome do Decisor *</div>
              <input v-model="newForm.decisor" placeholder="João Silva" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Telefone</div>
              <input v-model="newForm.telefone" placeholder="(85) 9 9999-9999" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Empresa</div>
              <input v-model="newForm.negocio" placeholder="Empresa XYZ" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Instagram</div>
              <input v-model="newForm.instagram" placeholder="@empresa" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Vendedores</div>
              <input v-model.number="newForm.num_vendedores" type="number" min="0" />
            </div>
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Nome da Ponte</div>
              <input v-model="newForm.nome_ponte" placeholder="Atendente que abriu a porta" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Resultado</div>
              <select v-model="newForm.resultado">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Data de retorno</div>
              <input type="date" v-model="newForm.data_retorno" />
            </div>
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Informações úteis</div>
              <textarea v-model="newForm.info" rows="2" placeholder="Detalhes para a sessão estratégica..."></textarea>
            </div>
            <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:6px;padding-top:4px">
              <button class="btn" @click="showModal=false">Cancelar</button>
              <button class="btn btn-primary" :disabled="createSaving" @click="createLead">
                {{ createSaving ? 'Criando...' : 'Criar lead' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast" class="toast">✓ {{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }

const STATUSES: LeadStatus[] = [
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado','Sem interesse','Não atende',
]
const FU_DAYS = [2,4,6,8,10,12,14,16,18,20]
const STATUS_TAG: Record<string,string> = {
  'Aguardando retorno':'tag-amber','Follow-up':'tag-blue','De molho':'tag-purple',
  'Reunião agendada':'tag-teal','Enviar proposta':'tag-amber','Proposta enviada':'tag-blue',
  'Fechado':'tag-green','Recusado':'tag-red','Sem interesse':'tag-gray','Não atende':'tag-gray',
}

const filterStatus = ref('Todos')
const searchQ      = ref('')
const selectedId   = ref<string|null>(null)
const showModal    = ref(false)
const toast        = ref<string|null>(null)
const detailSaving = ref(false)
const createSaving = ref(false)
const createError  = ref<string|null>(null)

const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }
const fuDone    = (l: LeadWithFU) => (l.followups||[]).filter(f => f.completed_at).length
const sortedFU  = (fus: Followup[]) => [...(fus||[])].sort((a,b) => a.attempt_index-b.attempt_index)
const daysIn    = (dt: string) => Math.floor((Date.now()-new Date(dt).getTime())/86400000)
const statusTagClass = (s: string) => STATUS_TAG[s] || 'tag-gray'
const isVencido = (l: LeadWithFU) => l.data_retorno && new Date(l.data_retorno) <= new Date() && !['Fechado','Recusado','Sem interesse'].includes(l.resultado)

const { data: leads, refresh } = await useAsyncData<LeadWithFU[]>('pipeline-leads', () => $fetch('/api/leads'), { default:()=>[] })

const totalLeads  = computed(() => (leads.value||[]).length)
const activeLeads = computed(() => (leads.value||[]).filter(l => !['Fechado','Recusado'].includes(l.resultado)).length)
const countByStatus = computed(() => (leads.value||[]).reduce((a:Record<string,number>,l) => { a[l.resultado]=(a[l.resultado]||0)+1; return a }, {}))

const filtered = computed(() => (leads.value||[]).filter(l => {
  const ms = filterStatus.value === 'Todos' || l.resultado === filterStatus.value
  const q  = searchQ.value.toLowerCase()
  const mq = !q || l.decisor.toLowerCase().includes(q) || (l.negocio||'').toLowerCase().includes(q) || (l.telefone||'').includes(q)
  return ms && mq
}))

const selectedLead = computed(() => (leads.value||[]).find(l => l.id === selectedId.value)||null)

function selectLead(l: LeadWithFU) { selectedId.value = selectedId.value === l.id ? null : l.id }

// Edit form
const editForm = reactive<Record<string,any>>({})
watch(selectedLead, l => {
  if (!l) return
  Object.assign(editForm, { decisor:l.decisor, telefone:l.telefone||'', negocio:l.negocio||'', instagram:l.instagram||'',
    num_vendedores:l.num_vendedores||null, nome_ponte:l.nome_ponte||'', resultado:l.resultado,
    data_retorno:l.data_retorno||'', reuniao_agendada:l.reuniao_agendada, turno:l.turno||'', horario:l.horario||'', info:l.info||'' })
}, { immediate: true })

const detailFields = [
  { key:'decisor',        label:'Decisor' },
  { key:'telefone',       label:'Telefone' },
  { key:'negocio',        label:'Empresa' },
  { key:'instagram',      label:'Instagram' },
  { key:'nome_ponte',     label:'Ponte',          wide: true },
  { key:'resultado',      label:'Resultado',      type:'select' },
  { key:'data_retorno',   label:'Data retorno',   type:'date' },
  { key:'turno',          label:'Turno' },
  { key:'horario',        label:'Horário' },
  { key:'info',           label:'Informações',    type:'textarea', wide: true },
]

async function saveLead() {
  if (!selectedLead.value) return
  detailSaving.value = true
  try {
    await $fetch(`/api/leads/${selectedLead.value.id}`, { method:'PATCH', body:editForm })
    await refresh()
    showToast('Salvo!')
  } finally { detailSaving.value = false }
}

async function removeLead(id: string) {
  if (!confirm('Remover este lead?')) return
  await $fetch(`/api/leads/${id}`, { method:'DELETE' })
  selectedId.value = null
  await refresh()
  showToast('Lead removido.')
}

async function toggleFU(lead: LeadWithFU, idx: number) {
  const fu = lead.followups.find(f => f.attempt_index === idx)
  const done = !fu?.completed_at
  const l = (leads.value||[]).find(l => l.id === lead.id)
  if (l) { const f = l.followups.find(f => f.attempt_index===idx); if(f) f.completed_at = done ? new Date().toISOString() : null }
  await $fetch(`/api/leads/${lead.id}/followup`, { method:'PATCH', body:{ attempt_index:idx, completed:done } })
}

// New form
const newForm = reactive<Record<string,any>>({
  decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null,
  nome_ponte:'', resultado:'Aguardando retorno', data_retorno:'', info:'',
})

async function createLead() {
  if (!newForm.decisor) { createError.value = 'Informe o nome do decisor.'; return }
  createSaving.value = true; createError.value = null
  try {
    await $fetch('/api/leads', { method:'POST', body:{ ...newForm, reuniao_agendada:false } })
    await refresh()
    showModal.value = false
    showToast('Lead criado!')
    Object.assign(newForm, { decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null, nome_ponte:'', resultado:'Aguardando retorno', data_retorno:'', info:'' })
  } catch(e:any) {
    createError.value = e?.data?.message || 'Erro ao criar.'
  } finally { createSaving.value = false }
}
</script>
