<template>
  <span ref="el" class="tabular">{{ display }}</span>
</template>

<script setup lang="ts">
// Contador animado: interpola de 0 (ou do valor anterior) ate o alvo com easing,
// so quando entra na viewport. Formata em pt-BR. Respeita prefers-reduced-motion.
const props = withDefaults(defineProps<{
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
}>(), { duration: 900, decimals: 0, prefix: '', suffix: '' })

const el   = ref<HTMLElement | null>(null)
const cur  = ref(0)
let raf = 0
let started = false

const fmt = (n: number) => props.prefix + n.toLocaleString('pt-BR', {
  minimumFractionDigits: props.decimals,
  maximumFractionDigits: props.decimals,
}) + props.suffix
const display = computed(() => fmt(cur.value))

function animate(to: number, from = cur.value) {
  cancelAnimationFrame(raf)
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) { cur.value = to; return }
  const t0 = performance.now()
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / props.duration)
    const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
    cur.value = from + (to - from) * e
    if (p < 1) raf = requestAnimationFrame(step)
    else cur.value = to
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true
      animate(props.value, 0)
      io.disconnect()
    }
  }, { threshold: 0.2 })
  if (el.value) io.observe(el.value)
})

// Re-anima quando o alvo muda (apos ja ter iniciado)
watch(() => props.value, (v, old) => { if (started) animate(v, old ?? 0) })

onUnmounted(() => cancelAnimationFrame(raf))
</script>
