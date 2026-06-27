<template>
  <Teleport to="body">
    <div
      style="position:fixed;inset:0;background:rgba(40,40,40,.6);backdrop-filter:blur(2px);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px"
      @click.self="$emit('close')"
    >
      <div class="card" style="width:100%;max-width:560px;max-height:90vh;overflow-y:auto">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:15px;font-weight:600">Importar leads via CSV</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:2px">Maximo 500 leads por importacao</div>
          </div>
          <button class="btn" @click="$emit('close')" style="padding:4px 8px">X</button>
        </div>

        <!-- Step 1: Upload -->
        <template v-if="step === 1">
          <div
            class="drop-zone"
            :class="{ 'drop-zone--over': dragging }"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div style="font-size:13px;color:var(--text-2);margin-top:8px">Arraste um arquivo .csv ou clique para selecionar</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:4px">Colunas suportadas: decisor*, telefone, negocio, instagram, nome_ponte, segmento, cidade, porte, fonte</div>
          </div>
          <input ref="fileInput" type="file" accept=".csv,text/csv" style="display:none" @change="onFileSelect" />

          <div style="margin-top:12px;background:var(--bg-subtle);border-radius:8px;padding:12px;font-size:11px;color:var(--text-2)">
            <div style="font-weight:600;margin-bottom:6px;color:var(--text-2)">Exemplo de CSV:</div>
            <code style="white-space:pre;font-family:monospace;font-size:10px;line-height:1.6">decisor,telefone,negocio,porte,fonte
Joao Silva,11999999999,Empresa ABC,media,cold_call
Maria Santos,11888888888,Tech XYZ,grande,linkedin</code>
          </div>
        </template>

        <!-- Step 2: Column mapping -->
        <template v-else-if="step === 2">
          <div style="font-size:13px;font-weight:500;margin-bottom:10px">
            {{ parsedRows.length }} linhas detectadas. Mapeie as colunas:
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div v-for="field in FIELDS" :key="field.key">
              <div style="font-size:11px;color:var(--text-2);font-weight:500;margin-bottom:3px">
                {{ field.label }}{{ field.required ? ' *' : '' }}
              </div>
              <select v-model="mapping[field.key]" style="font-size:12px">
                <option value="">Ignorar</option>
                <option v-for="col in csvHeaders" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button class="btn" @click="step = 1">Voltar</button>
            <button class="btn btn-primary" :disabled="!mapping.decisor" @click="step = 3">
              Previsualizar
            </button>
          </div>
        </template>

        <!-- Step 3: Preview + confirm -->
        <template v-else-if="step === 3">
          <div style="font-size:13px;font-weight:500;margin-bottom:10px">
            Preview (primeiras {{ Math.min(5, mappedRows.length) }} de {{ mappedRows.length }} linhas):
          </div>

          <div style="overflow-x:auto;margin-bottom:14px">
            <table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead>
                <tr style="border-bottom:1px solid var(--border-soft)">
                  <th v-for="col in visibleCols" :key="col"
                    style="text-align:left;padding:4px 8px;font-weight:500;color:var(--text-3);text-transform:uppercase;font-size:10px">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in mappedRows.slice(0, 5)" :key="i"
                  style="border-bottom:1px solid var(--bg-subtle)">
                  <td v-for="col in visibleCols" :key="col"
                    style="padding:5px 8px;color:var(--text-2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ row[col] || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="importResult" style="padding:12px;border-radius:8px;font-size:13px;margin-bottom:12px"
            :style="importResult.skipped > 0
              ? 'background:var(--warn-bg);border:1px solid var(--warn-bd);color:var(--warn)'
              : 'background:var(--ok-bg);border:1px solid var(--ok-bd);color:var(--ok)'">
            <strong>{{ importResult.created }}</strong> leads criados.
            <span v-if="importResult.skipped > 0">
              <strong>{{ importResult.skipped }}</strong> ignorados (telefone duplicado).
            </span>
          </div>

          <div v-if="importError" style="padding:10px;border-radius:8px;font-size:12px;margin-bottom:12px;background:var(--bad-bg);border:1px solid var(--bad-bd);color:var(--bad)">
            {{ importError }}
          </div>

          <div style="display:flex;gap:6px;justify-content:flex-end">
            <button class="btn" @click="step = 2" :disabled="importing">Voltar</button>
            <button v-if="!importResult" class="btn btn-primary" :disabled="importing" @click="runImport">
              {{ importing ? 'Importando...' : `Importar ${mappedRows.length} leads` }}
            </button>
            <button v-else class="btn btn-primary" @click="$emit('imported'); $emit('close')">
              Concluir
            </button>
          </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: []; imported: [] }>()

const FIELDS = [
  { key: 'decisor',        label: 'Decisor',           required: true },
  { key: 'telefone',       label: 'Telefone',          required: false },
  { key: 'negocio',        label: 'Empresa',           required: false },
  { key: 'instagram',      label: 'Instagram',         required: false },
  { key: 'nome_ponte',     label: 'Indicacao / Ponte', required: false },
  { key: 'segmento',       label: 'Segmento',          required: false },
  { key: 'cidade',         label: 'Cidade',            required: false },
  { key: 'porte',          label: 'Porte',             required: false },
  { key: 'fonte',          label: 'Fonte',             required: false },
  { key: 'num_vendedores', label: 'Num. vendedores',   required: false },
]

const step         = ref(1)
const dragging     = ref(false)
const fileInput    = ref<HTMLInputElement | null>(null)
const csvHeaders   = ref<string[]>([])
const parsedRows   = ref<Record<string, string>[]>([])
const mapping      = reactive<Record<string, string>>({
  decisor: '', telefone: '', negocio: '', instagram: '',
  nome_ponte: '', segmento: '', cidade: '', porte: '', fonte: '', num_vendedores: '',
})
const importing    = ref(false)
const importResult = ref<{ created: number; skipped: number } | null>(null)
const importError  = ref<string | null>(null)

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) parseFile(file)
}

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) parseFile(file)
}

function parseFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    csvHeaders.value = headers

    parsedRows.value = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    }).filter(r => Object.values(r).some(v => v))

    // Auto-map columns with matching names
    for (const field of FIELDS) {
      const match = headers.find(h =>
        h.toLowerCase() === field.key.toLowerCase() ||
        h.toLowerCase() === field.label.toLowerCase()
      )
      if (match) mapping[field.key] = match
    }

    step.value = 2
  }
  reader.readAsText(file, 'UTF-8')
}

const mappedRows = computed(() =>
  parsedRows.value.map(row => {
    const out: Record<string, string> = {}
    for (const field of FIELDS) {
      if (mapping[field.key]) out[field.key] = row[mapping[field.key]] ?? ''
    }
    return out
  }).filter(r => r.decisor?.trim())
)

const visibleCols = computed(() =>
  FIELDS.map(f => f.key).filter(k => mappedRows.value.some(r => r[k]))
)

async function runImport() {
  importing.value = true
  importError.value = null
  try {
    const result = await $fetch<{ created: number; skipped: number }>('/api/leads/import', {
      method: 'POST',
      body: { rows: mappedRows.value },
    })
    importResult.value = result
    if (result.created > 0) emit('imported')
  } catch (e: any) {
    importError.value = e?.data?.message || 'Erro ao importar leads.'
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed var(--accent-bd);
  border-radius: 10px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-subtle);
}

.drop-zone:hover,
.drop-zone--over {
  border-color: #0f62fe;
  background: var(--accent-soft);
}
</style>
