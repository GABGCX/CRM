// composables/useTheme.ts
// Aplica as CSS variables do tema do tenant.
// Chamado no app.vue e sempre que o tema mudar.

import type { OrgTheme } from '~/types'

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return null
  let rv = parseInt(r[1], 16) / 255
  let gv = parseInt(r[2], 16) / 255
  let bv = parseInt(r[3], 16) / 255
  const max = Math.max(rv, gv, bv), min = Math.min(rv, gv, bv)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rv: h = ((gv - bv) / d + (gv < bv ? 6 : 0)) / 6; break
      case gv: h = ((bv - rv) / d + 2) / 6; break
      case bv: h = ((rv - gv) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export const useTheme = () => {
  function applyTheme(theme: Partial<OrgTheme>) {
    if (!import.meta.client) return

    const primaryColor = theme.primary_color || '#2563eb'
    const hsl = hexToHsl(primaryColor)

    const root = document.documentElement
    if (hsl) {
      root.style.setProperty('--brand-h', String(hsl.h))
      root.style.setProperty('--brand-s', `${hsl.s}%`)
      root.style.setProperty('--brand-l', `${hsl.l}%`)
    }

    if (theme.favicon_url) {
      const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
        || Object.assign(document.createElement('link'), { rel: 'icon' })
      link.href = theme.favicon_url
      document.head.appendChild(link)
    }

    if (theme.product_name) {
      document.title = theme.product_name
    }
  }

  // Gera string de CSS vars para SSR (head inline)
  function themeToStyle(theme: Partial<OrgTheme>): string {
    const primaryColor = theme.primary_color || '#2563eb'
    const hsl = hexToHsl(primaryColor)
    if (!hsl) return ''
    return `:root{--brand-h:${hsl.h};--brand-s:${hsl.s}%;--brand-l:${hsl.l}%}`
  }

  return { applyTheme, themeToStyle }
}
