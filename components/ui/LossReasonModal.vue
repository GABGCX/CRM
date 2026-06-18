<template>
  <Transition name="fade">
    <div v-if="show"
      style="position:fixed;inset:0;background:rgba(40,40,40,.55);backdrop-filter:blur(2px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px"
      @click.self="$emit('cancel')">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;width:100%;max-width:400px;padding:24px">

        <div style="font-size:15px;font-weight:600;color:var(--text-1);margin-bottom:4px">Qual foi o motivo da perda?</div>
        <div style="font-size:13px;color:var(--text-2);margin-bottom:20px">
          {{ statusLabel }} — registrar o motivo ajuda a identificar padroes de objecao.
        </div>

        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
          <button
            v-for="reason in REASONS" :key="reason"
            @click="selected = reason"
            style="padding:9px 14px;border-radius:7px;text-align:left;font-size:13px;font-family:inherit;cursor:pointer;transition:all .1s"
            :style="selected === reason
              ? 'background:var(--accent);border:1px solid var(--accent);color:#fff;font-weight:500'
              : 'background:var(--bg-subtle);border:1px solid var(--border);color:var(--text-1)'">
            {{ reason }}
          </button>
        </div>

        <div v-if="selected === 'Outro'" style="margin-bottom:16px">
          <textarea v-model="outroText" rows="2" placeholder="Descreva o motivo..."
            style="resize:none" maxlength="200" />
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="$emit('cancel')">Pular</button>
          <button class="btn btn-primary" :disabled="!canConfirm" @click="confirm">Registrar</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ show: boolean; status: string }>()
const emit  = defineEmits<{ confirm: [reason: string]; cancel: [] }>()

const REASONS = ['Preco alto', 'Ja tem solucao', 'Sem budget', 'Timing ruim', 'Nao precisa', 'Outro']

const selected  = ref('')
const outroText = ref('')

const statusLabel = computed(() =>
  props.status === 'Recusado' ? 'Lead recusado' : 'Sem interesse'
)

const canConfirm = computed(() =>
  !!selected.value && (selected.value !== 'Outro' || outroText.value.trim().length > 0)
)

function confirm() {
  const reason = selected.value === 'Outro' ? outroText.value.trim() : selected.value
  emit('confirm', reason)
  selected.value  = ''
  outroText.value = ''
}

watch(() => props.show, v => {
  if (!v) { selected.value = ''; outroText.value = '' }
})
</script>
