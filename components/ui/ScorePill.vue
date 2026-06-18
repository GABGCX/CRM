<template>
  <span class="score-pill" :title="`Score ICP: ${score}`"
    :style="{ color: leadScoreColor(score), background: leadScoreBg(score) }">
    <template v-if="prefix">{{ prefix }} </template>{{ score }}
  </span>
</template>

<script setup lang="ts">
import type { Lead } from '~/types'
import { calcLeadScore, leadScoreColor, leadScoreBg } from '~/utils/leadDomain'

const props = defineProps<{ lead: Lead; prefix?: string }>()
const score = computed(() => calcLeadScore(props.lead))
</script>

<style scoped>
.score-pill {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 20px;
  white-space: nowrap;
}
</style>
