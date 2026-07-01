<template>
  <!-- Marca animada: ladrilho em gradiente + glifo (aneis orbitando, nucleo pulsando) -->
  <span
    class="bm"
    :class="{ 'bm--glow': glow }"
    :style="{ width: size + 'px', height: size + 'px', borderRadius: radius }">
    <svg :width="Math.round(size * 0.62)" :height="Math.round(size * 0.62)" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.5" opacity=".92" />
      <circle class="bm-core" cx="12" cy="12" r="4" fill="#fff" />
      <g class="bm-spokes">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" />
      </g>
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; radius?: string; glow?: boolean }>(), {
  size: 28,
  radius: '9px',
  glow: false,
})
</script>

<style scoped>
.bm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--grad-brand);
  overflow: hidden;
  position: relative;
}
.bm--glow { box-shadow: var(--glow-brand); }
.bm::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 60% at 30% 22%, rgba(255,255,255,.35), transparent 70%);
  pointer-events: none;
}
.bm-spokes {
  transform-box: fill-box;
  transform-origin: center;
  animation: bm-rot 9s linear infinite;
}
.bm-core {
  transform-box: fill-box;
  transform-origin: center;
  animation: bm-pulse 3.2s var(--ease-out) infinite;
}
@keyframes bm-rot   { to { transform: rotate(360deg); } }
@keyframes bm-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .72; transform: scale(.84); } }
@media (prefers-reduced-motion: reduce) {
  .bm-spokes, .bm-core { animation: none; }
}
</style>
