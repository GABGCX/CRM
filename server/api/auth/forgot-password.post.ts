import { serverSupabaseServiceRole } from '#supabase/server'
import { throwApiError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throwApiError('VALIDATION', 'E-mail inválido.')
  }

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NUXT_PUBLIC_SITE_URL || ''}/reset-password`,
  })

  if (error) {
    throwApiError('INTERNAL', 'Não foi possível enviar o e-mail.')
  }

  return { ok: true }
})
