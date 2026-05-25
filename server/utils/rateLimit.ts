// server/utils/rateLimit.ts
// Rate limiter em memória simples.
// Para produção, substituir por Redis (unstorage/ioredis já são dependências do projeto).

interface Bucket {
  count: number
  reset: number
}

const _buckets = new Map<string, Bucket>()

/**
 * Verifica se a chave está dentro do limite.
 * @returns true  — requisição permitida
 * @returns false — limite excedido
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): boolean {
  const now = Date.now()
  const bucket = _buckets.get(key)

  if (!bucket || now > bucket.reset) {
    _buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

/** Retorna quantos ms faltam para reset da janela (0 se não há bucket). */
export function rateLimitRetryAfter(key: string): number {
  const bucket = _buckets.get(key)
  if (!bucket) return 0
  return Math.max(0, bucket.reset - Date.now())
}
