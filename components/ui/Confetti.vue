<template>
  <Teleport to="body">
    <div v-if="pieces.length" class="cf" aria-hidden="true">
      <span v-for="p in pieces" :key="p.id" class="cf-p" :style="p.style" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Burst de confete puro-CSS, disparado quando a prop `run` muda (>0).
const props = defineProps<{ run: number }>()
const pieces = ref<{ id: number; style: string }[]>([])
let clear: ReturnType<typeof setTimeout> | null = null

const COLORS = ['#0b63ff', '#7c3aed', '#12d3ff', '#f59e0b', '#24a148', '#e11d63']

function burst() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const n = 96
  const now = Date.now()
  pieces.value = Array.from({ length: n }, (_, i) => {
    const left  = Math.random() * 100
    const delay = Math.random() * 0.18
    const dur   = 1.7 + Math.random() * 1.3
    const rot   = (Math.random() * 4 + 1) * 360 * (Math.random() > .5 ? 1 : -1)
    const w     = 6 + Math.random() * 6
    const drift = (Math.random() * 2 - 1) * 180
    const color = COLORS[i % COLORS.length]
    return {
      id: now + i,
      style: `left:${left}%;--drift:${drift}px;--rot:${rot}deg;width:${w.toFixed(0)}px;height:${(w * 0.42 + 3).toFixed(0)}px;background:${color};animation-delay:${delay.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s;`,
    }
  })
  if (clear) clearTimeout(clear)
  clear = setTimeout(() => { pieces.value = [] }, 3400)
}

watch(() => props.run, (v) => { if (v > 0) burst() })
onUnmounted(() => { if (clear) clearTimeout(clear) })
</script>

<style scoped>
.cf { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
.cf-p {
  position: absolute; top: -18px; border-radius: 2px; opacity: .92;
  animation-name: cf-fall; animation-timing-function: cubic-bezier(.2, .6, .35, 1); animation-fill-mode: forwards;
}
@keyframes cf-fall {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(var(--drift), 106vh) rotate(var(--rot)); opacity: .25; }
}
@media (prefers-reduced-motion: reduce) { .cf { display: none; } }
</style>
