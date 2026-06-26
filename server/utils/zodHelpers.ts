import { z } from 'zod'

// Campo numerico opcional vindo de formulario HTML: inputs sempre mandam string.
// Normaliza antes de validar: '' / null / undefined viram null; string numerica
// vira numero; numero passa direto. Evita o erro "Expected number, received string".
export const numericOptional = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return null
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? v : n
  }
  return v
}, z.number().nullable().optional())

// URL opcional: campo vazio do formulario ('') vira null em vez de falhar o url().
export const urlOptional = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.string().url().nullable().optional(),
)
