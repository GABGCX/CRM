<template>
  <span v-if="value && value > 0" class="money-pill">R$ {{ compact ? fmtK(value) : fmtMoney(value) }}</span>
</template>

<script setup lang="ts">
import { fmtMoney, fmtK } from '~/utils/leadDomain'

defineProps<{ value: number | null | undefined; compact?: boolean }>()
</script>

<style scoped>
.money-pill {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  padding: 0 5px;
  white-space: nowrap;
}
</style>
