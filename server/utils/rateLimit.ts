// server/utils/rateLimit.ts
// Rate limiter persistente via tabela do Supabase.
// Funciona em deploys serverless e multi-instância.
// Trade-off: race conditions de ±1 request são aceitáveis para rate limiting.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed: boolean
  retryAfterSecs: number
}

/**
 * Verifica e incrementa o bucket de rate limit para a chave dada.
 * @param admin  - cliente service role (bypass de RLS)
 * @param key    - identificador único do bucket (ex: `register:1.2.3.4`)
 * @param max    - máximo de requisições na janela
 * @param windowSecs - tamanho da janela em segundos
 */
export async function checkRateLimit(
  admin: SupabaseClient,
  key: string,
  max: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const now = new Date()

  const { data: bucket } = await admin
    .from('rate_limit_buckets')
    .select('count, window_start')
    .eq('key', key)
    .single()

  const windowExpired = !bucket ||
    new Date(bucket.window_start).getTime() < now.getTime() - windowSecs * 1000

  if (windowExpired) {
    await admin
      .from('rate_limit_buckets')
      .upsert({ key, count: 1, window_start: now.toISOString() }, { onConflict: 'key' })
    return { allowed: true, retryAfterSecs: 0 }
  }

  if (bucket.count >= max) {
    const resetAt = new Date(new Date(bucket.window_start).getTime() + windowSecs * 1000)
    const retryAfterSecs = Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / 1000))
    return { allowed: false, retryAfterSecs }
  }

  await admin
    .from('rate_limit_buckets')
    .update({ count: bucket.count + 1 })
    .eq('key', key)

  return { allowed: true, retryAfterSecs: 0 }
}
