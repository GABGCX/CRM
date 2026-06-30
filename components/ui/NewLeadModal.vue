<template>
  <Transition name="nlm" appear>
    <div
      class="nlm-backdrop"
      @click.self="$emit('close')">
      <div class="nlm-card">
        <div class="nlm-head">
          <div style="font-size:16px;font-weight:600;color:var(--text-1)">Novo lead</div>
          <button class="btn" @click="$emit('close')" style="padding:4px 10px">X</button>
        </div>
        <div style="padding:20px 24px">
          <div v-if="createError"
            style="background:var(--bad-bg);border:1px solid var(--bad-bd);color:#dc2626;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px">
            {{ createError }}
            <span v-if="duplicateLeadId">
              &nbsp;
              <button @click="goToDuplicate"
                style="text-decoration:underline;background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px;font-family:inherit;padding:0">
                Ver lead existente
              </button>
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="grid-column:span 2" class="form-field">
              <label class="input-label">Decisor *</label>
              <input v-model="newForm.decisor" type="text" placeholder="João Silva" />
              <div style="font-size:11px;color:var(--text-3)">Nome de quem decide a compra</div>
            </div>
            <div class="form-field">
              <label class="input-label">Telefone</label>
              <input v-model="newForm.telefone" type="text" placeholder="(85) 9 9999-9999" />
              <div style="font-size:11px;color:var(--text-3)">Usado para detectar duplicatas</div>
            </div>
            <div class="form-field">
              <label class="input-label">Empresa</label>
              <input v-model="newForm.negocio" type="text" placeholder="Empresa XYZ" />
            </div>
            <div class="form-field">
              <label class="input-label">Instagram</label>
              <input v-model="newForm.instagram" type="text" placeholder="@empresa" />
            </div>
            <div class="form-field">
              <label class="input-label">Vendedores</label>
              <input v-model.number="newForm.num_vendedores" type="number" min="0" />
            </div>
            <div style="grid-column:span 2" class="form-field">
              <label class="input-label">Indicação / Ponte</label>
              <input v-model="newForm.nome_ponte" type="text" placeholder="Ex: Maria do RH que te apresentou" />
              <div style="font-size:11px;color:var(--text-3)">Quem te apresentou este lead? (opcional)</div>
            </div>
            <div class="form-field">
              <label class="input-label">Resultado</label>
              <select v-model="newForm.resultado">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="input-label">
                Data de retorno
                <button type="button" @click="suggestRetorno"
                  style="border:none;background:none;color:#0f62fe;font-size:11px;cursor:pointer;padding:0 0 0 4px;font-family:inherit">
                  +2d
                </button>
              </label>
              <input type="date" v-model="newForm.data_retorno" />
            </div>
            <div style="grid-column:span 2" class="form-field">
              <label class="input-label">Observações</label>
              <textarea v-model="newForm.info" rows="2"
                placeholder="Contexto relevante, dores mencionadas, próximo passo..." />
            </div>
            <div style="grid-column:span 2" class="form-field">
              <label class="input-label">Cadência de prospecção</label>
              <select v-model="newForm.cadence_id">
                <option value="">Nenhuma</option>
                <option v-for="c in cadences" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <div style="font-size:11px;color:var(--text-3)">Sequência de passos que guia o follow-up</div>
            </div>

            <div style="grid-column:span 2">
              <button type="button" @click="showExtra = !showExtra"
                style="background:none;border:none;color:#0f62fe;font-size:12px;cursor:pointer;padding:0;font-family:inherit;font-weight:500">
                {{ showExtra ? '▲ Ocultar dados adicionais' : '▼ Dados adicionais (ICP)' }}
              </button>
            </div>
            <template v-if="showExtra">
              <div class="form-field">
                <label class="input-label">Fonte</label>
                <select v-model="newForm.fonte">
                  <option value="">Nenhum</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indicacao">Indicação</option>
                  <option value="evento">Evento</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div class="form-field">
                <label class="input-label">Porte</label>
                <select v-model="newForm.porte">
                  <option value="">Nenhum</option>
                  <option value="micro">Micro</option>
                  <option value="pequena">Pequena</option>
                  <option value="media">Média</option>
                  <option value="grande">Grande</option>
                </select>
              </div>
              <div class="form-field">
                <label class="input-label">Segmento</label>
                <input v-model="newForm.segmento" type="text" placeholder="Ex: SaaS, Varejo, Saúde" />
              </div>
              <div class="form-field">
                <label class="input-label">Cidade</label>
                <input v-model="newForm.cidade" type="text" placeholder="São Paulo" />
              </div>
              <div v-for="cf in customDefs" :key="cf.id" class="form-field" style="grid-column:span 2">
                <label class="input-label">{{ cf.label }}</label>
                <select v-if="cf.field_type === 'select'" v-model="newForm.custom_fields[cf.key]">
                  <option value="">--</option>
                  <option v-for="o in (cf.options || [])" :key="o" :value="o">{{ o }}</option>
                </select>
                <input v-else
                  :type="cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'"
                  v-model="newForm.custom_fields[cf.key]" />
              </div>
            </template>

            <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:8px;padding-top:4px">
              <button class="btn" @click="$emit('close')">Cancelar</button>
              <button class="btn btn-primary" :disabled="createSaving" @click="handleCreateLead">
                {{ createSaving ? 'Criando...' : 'Criar lead' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Cadence } from '~/types'
import { STATUSES, localDateISO } from '~/utils/leadDomain'

defineProps<{ cadences: Cadence[]; customDefs: any[] }>()
const emit = defineEmits<{ close: []; created: []; 'go-duplicate': [id: string] }>()

const { createLead } = useLeads()

const INITIAL = () => ({
  decisor: '', telefone: '', negocio: '', instagram: '', num_vendedores: null as number | null,
  nome_ponte: '', resultado: 'Novo', data_retorno: '', info: '',
  fonte: '', segmento: '', cidade: '', estado: '', porte: '', cadence_id: '',
  custom_fields: {} as Record<string, any>,
})
const newForm = reactive<Record<string, any>>(INITIAL())
const showExtra      = ref(false)
const createSaving   = ref(false)
const createError    = ref<string | null>(null)
const duplicateLeadId = ref<string | null>(null)

function suggestRetorno() {
  const d = new Date(); d.setDate(d.getDate() + 2)
  newForm.data_retorno = localDateISO(d)
}

function goToDuplicate() {
  if (duplicateLeadId.value) emit('go-duplicate', duplicateLeadId.value)
}

async function handleCreateLead() {
  if (!newForm.decisor) { createError.value = 'Informe o nome do decisor.'; return }
  createSaving.value = true; createError.value = null; duplicateLeadId.value = null
  try {
    // String vazia em campos opcionais (cadence_id, fonte, porte, datas...) quebra a validacao; vira null.
    const NULLABLE = ['telefone', 'negocio', 'instagram', 'nome_ponte', 'data_retorno', 'info', 'fonte', 'segmento', 'cidade', 'estado', 'porte', 'cadence_id']
    const payload: Record<string, any> = { ...newForm, reuniao_agendada: false }
    for (const k of NULLABLE) if (payload[k] === '') payload[k] = null
    payload.custom_fields = Object.fromEntries(
      Object.entries(payload.custom_fields || {}).filter(([, v]) => v !== '' && v != null)
    )
    await createLead(payload)
    emit('created')
    emit('close')
  } catch (e: any) {
    if (e?.data?.code === 'DUPLICATE_PHONE') {
      duplicateLeadId.value = e.data.existingId ?? null
      createError.value = `Já existe um lead com este telefone${e.data.existingName ? ` (${e.data.existingName})` : ''}.`
    } else {
      createError.value = e?.data?.message || 'Erro ao criar.'
    }
  } finally {
    createSaving.value = false
  }
}
</script>

<style scoped>
.nlm-backdrop {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(40,40,40,.6); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.nlm-card {
  background: var(--bg-card); border-radius: 14px; width: 100%; max-width: 500px;
  max-height: 92vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.08);
}
.nlm-head {
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border-soft);
  display: flex; align-items: center; justify-content: space-between;
}
.nlm-enter-active, .nlm-leave-active { transition: opacity .15s ease; }
.nlm-enter-from, .nlm-leave-to { opacity: 0; }
</style>
