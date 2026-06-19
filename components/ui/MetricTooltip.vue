<template>
  <span class="metric-tip-wrap">
    <span class="metric-tip-label">{{ label }}</span>
    <span
      class="metric-tip-trigger"
      @mouseenter="show = true"
      @mouseleave="show = false"
      @focus="show = true"
      @blur="show = false"
      tabindex="0"
      :aria-label="info.full"
    >?</span>
    <Transition name="tip">
      <div v-if="show" class="metric-tip-popover">
        <div class="metric-tip-full">{{ info.full }}</div>
        <div class="metric-tip-desc">{{ info.desc }}</div>
      </div>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import type { MetricKey } from '~/types'

const props = defineProps<{ metric: MetricKey }>()

const DICT: Record<MetricKey, { full: string; desc: string }> = {
  CE: {
    full: 'Contato Efetivo',
    desc: 'O decisor atendeu e você conseguiu conversar com ele.',
  },
  RM: {
    full: 'Reunião Marcada',
    desc: 'O lead aceitou agendar uma reunião estratégica com você.',
  },
  RR: {
    full: 'Reunião Realizada',
    desc: 'A reunião aconteceu de fato. O lead não desmarcou.',
  },
  FR: {
    full: 'Fechamento',
    desc: 'Contrato assinado. O lead se tornou cliente.',
  },
  LD: {
    full: 'Ligações Discadas',
    desc: 'Total de chamadas tentadas, independente de atenderem.',
  },
}

const label = computed(() => props.metric)
const info  = computed(() => DICT[props.metric])
const show  = ref(false)
</script>

<style scoped>
.metric-tip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.metric-tip-label {
  font-weight: 500;
}

.metric-tip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-2);
  font-size: 9px;
  font-weight: 600;
  cursor: help;
  flex-shrink: 0;
  outline: none;
  transition: background 0.1s;
}
.metric-tip-trigger:hover,
.metric-tip-trigger:focus {
  background: var(--accent-bd);
  color: #193497;
}

.metric-tip-popover {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-1);
  color: #fff;
  border-radius: 8px;
  padding: 9px 12px;
  width: 200px;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
}
.metric-tip-popover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--text-1);
}

.metric-tip-full {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}
.metric-tip-desc {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.5;
}

.tip-enter-active { transition: all 0.12s ease-out }
.tip-leave-active { transition: all 0.08s ease-in }
.tip-enter-from   { opacity: 0; transform: translateX(-50%) translateY(4px) }
.tip-leave-to     { opacity: 0; transform: translateX(-50%) translateY(2px) }
</style>
