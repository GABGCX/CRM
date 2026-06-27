<template>
  <div class="lqa" @click.stop>
    <button class="lqa-btn" :class="{ 'lqa-btn--flash': flash === 'ld' }"
      title="Registrar 1 ligacao no dia" @click="doBump('ld')">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 9.81 2 2 0 0 1 5 7.91h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
      Lig
    </button>
    <button class="lqa-btn" :class="{ 'lqa-btn--flash': flash === 'ce' }"
      title="Registrar 1 contato efetivo no dia" @click="doBump('ce')">
      CE
    </button>
    <button class="lqa-btn" :disabled="fuComplete"
      :title="fuComplete ? 'Todos os follow-ups concluidos' : 'Marcar proximo follow-up'"
      @click="$emit('fu')">
      FU
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup } from '~/types'
import { fuDone } from '~/utils/leadDomain'

const props = defineProps<{ lead: Lead & { followups?: Followup[] } }>()
defineEmits<{ fu: [] }>()

const { bump, load } = useDiaryToday()
const flash = ref<'ld' | 'ce' | null>(null)

const fuComplete = computed(() => fuDone(props.lead) >= 10)

async function doBump(field: 'ld' | 'ce') {
  await bump(field, 1)
  flash.value = field
  setTimeout(() => { if (flash.value === field) flash.value = null }, 700)
}

onMounted(() => load())
</script>

<style scoped>
.lqa { display: flex; gap: 4px; align-items: center; }
.lqa-btn {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 7px; border-radius: 5px;
  border: 1px solid var(--border); background: var(--bg-card);
  color: var(--text-2); font-size: 11px; font-weight: 600;
  font-family: inherit; cursor: pointer; white-space: nowrap;
  transition: all .12s;
}
.lqa-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.lqa-btn:disabled { opacity: .4; cursor: not-allowed; }
.lqa-btn--flash { background: var(--ok-bg); border-color: var(--ok-bd); color: var(--ok); }
</style>
