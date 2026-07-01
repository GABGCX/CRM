// Diretiva v-tilt: inclinacao 3D sutil seguindo o mouse (perspectiva + glare).
// Client-only. Respeita prefers-reduced-motion e desliga em telas de toque.
export default defineNuxtPlugin((nuxtApp) => {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  nuxtApp.vueApp.directive('tilt', {
    mounted(el: HTMLElement, binding) {
      const max = Number(binding.value ?? 6) // graus maximos
      if (reduce || window.matchMedia('(hover: none)').matches) return

      el.style.transformStyle = 'preserve-3d'
      el.style.transition = 'transform .18s cubic-bezier(.16,1,.3,1)'
      el.style.willChange = 'transform'

      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.transform =
          `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`
      }
      const onLeave = () => { el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)' }

      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      ;(el as any).__tilt = { onMove, onLeave }
    },
    unmounted(el: HTMLElement) {
      const h = (el as any).__tilt
      if (h) { el.removeEventListener('mousemove', h.onMove); el.removeEventListener('mouseleave', h.onLeave) }
    },
  })
})
