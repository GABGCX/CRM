#!/usr/bin/env node
// Trava anti-regressao do dark mode.
// Varre o CSS real (atributos style="..." e blocos <style>) em pages/ e components/
// e falha se achar cor hex fora da allowlist. Cores decorativas/de marca conhecidas sao permitidas.
// Uso: node scripts/check-hardcoded-colors.cjs  (exit 1 se houver violacao)

const fs = require('fs')
const path = require('path')

// Hex permitidos: decorativos/semanticos de marca que vivem como valor literal
// (dots de status, cores de funil, branco-sobre-cor, preto de sombra ja e rgba).
const ALLOW = new Set([
  '#fff', '#ffffff',            // texto branco sobre fundo colorido
  '#193497', '#0f2480',         // cobalt (legado)
  '#0f62fe', '#0353e9',         // azul IBM Carbon (marca atual)
  '#16a34a', '#dc2626', '#d97706', '#f59e0b', '#ef4444', // status (quando literal em SVG/JS-driven)
  '#2563eb', '#7c3aed', '#0d9488', '#8b5cf6', '#14b8a6',
  '#f97316', '#06b6d4', '#3b82f6', '#6366f1', '#64748b',
  '#6b7280', '#9ca3af', '#22c55e', '#EDA398', '#eda398',
  '#3730a3', '#1d4ed822',  // tints/brand decorativos (ok no claro e escuro)
])

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name.endsWith('.vue')) acc.push(p)
  }
  return acc
}

// Extrai trechos de CSS: conteudo de style="..." e de <style>...</style>.
// Ignora blocos [data-theme="dark"]{...} (valores escuros intencionais).
function cssChunks(src) {
  const noDark = src.replace(/\[data-theme="dark"\][^{]*\{[^}]*\}/g, '')
  const chunks = []
  for (const m of noDark.matchAll(/style="([^"]*)"/g)) chunks.push(m[1])
  for (const m of noDark.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) chunks.push(m[1])
  return chunks
}

const files = [...walk('pages'), ...walk('components')]
const violations = []

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  for (const chunk of cssChunks(src)) {
    for (const m of chunk.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const hex = m[0].toLowerCase()
      if (!ALLOW.has(hex) && !ALLOW.has(m[0])) violations.push({ f, hex: m[0] })
    }
  }
}

if (!violations.length) {
  console.log('OK - nenhuma cor hex fora da allowlist no CSS de pages/components.')
  process.exit(0)
}

// Agrupa por arquivo
const byFile = {}
for (const v of violations) (byFile[v.f] ||= []).push(v.hex)
console.log(`${violations.length} cores hex em CSS (use tokens var(--...)):\n`)
for (const [f, hexes] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  const counts = {}
  for (const h of hexes) counts[h] = (counts[h] || 0) + 1
  const summary = Object.entries(counts).map(([h, n]) => `${h}(${n})`).join(' ')
  console.log(`  ${hexes.length}\t${f}\n      ${summary}`)
}
process.exit(1)
