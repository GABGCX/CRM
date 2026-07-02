// Diretiva v-swipe-dismiss: arrastar a ALCA (topo) de um bottom-sheet pra baixo
// fecha (chama o callback). So em telas de toque. Deixa o conteudo rolar normal
// quando o toque comeca fora da alca.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('swipe-dismiss', {
    mounted(el: HTMLElement, binding) {
      if (typeof window === 'undefined') return
      if (!window.matchMedia('(hover: none)').matches) return // so em toque

      const HANDLE = 72 // zona superior arrastavel (px)
      const THRESHOLD = 110
      let startY = 0, dy = 0, active = false

      const onStart = (e: TouchEvent) => {
        const t = e.touches[0]
        if (t.clientY - el.getBoundingClientRect().top > HANDLE) { active = false; return }
        active = true; startY = t.clientY; dy = 0
        el.style.transition = 'none'
      }
      const onMove = (e: TouchEvent) => {
        if (!active) return
        dy = e.touches[0].clientY - startY
        if (dy > 0) { el.style.transform = `translateY(${dy}px)`; el.style.opacity = String(Math.max(.4, 1 - dy / 600)); e.preventDefault() }
      }
      const onEnd = () => {
        if (!active) return
        active = false
        el.style.transition = ''
        el.style.opacity = ''
        if (dy > THRESHOLD) {
          el.style.transform = ''
          try { navigator.vibrate?.(8) } catch { /* no-op */ }
          if (typeof binding.value === 'function') binding.value()
        } else {
          el.style.transform = 'translateY(0)'
        }
        dy = 0
      }

      el.addEventListener('touchstart', onStart, { passive: true })
      el.addEventListener('touchmove', onMove, { passive: false })
      el.addEventListener('touchend', onEnd)
      ;(el as any).__swipe = { onStart, onMove, onEnd }
    },
    unmounted(el: HTMLElement) {
      const h = (el as any).__swipe
      if (h) {
        el.removeEventListener('touchstart', h.onStart)
        el.removeEventListener('touchmove', h.onMove)
        el.removeEventListener('touchend', h.onEnd)
      }
    },
  })
})
