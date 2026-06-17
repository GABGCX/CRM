import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit } from '../../server/utils/rateLimit'
import type { SupabaseClient } from '@supabase/supabase-js'

function makeAdmin(bucket: { count: number; window_start: string } | null) {
  const upsert = vi.fn().mockResolvedValue({})
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
  const single = vi.fn().mockResolvedValue({ data: bucket, error: null })
  const eq     = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  const from   = vi.fn().mockReturnValue({ select, upsert, update })

  return { from } as unknown as SupabaseClient
}

describe('checkRateLimit', () => {
  const KEY = 'test:127.0.0.1'
  const MAX = 5
  const WINDOW = 3600

  it('permite a primeira requisição (bucket inexistente)', async () => {
    const admin = makeAdmin(null)
    const result = await checkRateLimit(admin, KEY, MAX, WINDOW)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterSecs).toBe(0)
  })

  it('permite quando janela expirou', async () => {
    const expired = {
      count: 99,
      window_start: new Date(Date.now() - 7200 * 1000).toISOString(), // 2h atrás
    }
    const admin = makeAdmin(expired)
    const result = await checkRateLimit(admin, KEY, MAX, WINDOW)
    expect(result.allowed).toBe(true)
  })

  it('permite quando count está abaixo do máximo', async () => {
    const bucket = {
      count: 3,
      window_start: new Date().toISOString(),
    }
    const admin = makeAdmin(bucket)
    const result = await checkRateLimit(admin, KEY, MAX, WINDOW)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterSecs).toBe(0)
  })

  it('bloqueia quando count atingiu o máximo', async () => {
    const bucket = {
      count: 5,
      window_start: new Date().toISOString(),
    }
    const admin = makeAdmin(bucket)
    const result = await checkRateLimit(admin, KEY, MAX, WINDOW)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSecs).toBeGreaterThan(0)
    expect(result.retryAfterSecs).toBeLessThanOrEqual(WINDOW)
  })

  it('retryAfterSecs é aproximadamente o tempo restante da janela', async () => {
    const secondsAgo = 600 // 10 min atrás
    const bucket = {
      count: 5,
      window_start: new Date(Date.now() - secondsAgo * 1000).toISOString(),
    }
    const admin = makeAdmin(bucket)
    const result = await checkRateLimit(admin, KEY, MAX, WINDOW)
    const expectedRetry = WINDOW - secondsAgo
    // Tolerância de 2s para latência de execução do teste
    expect(result.retryAfterSecs).toBeGreaterThanOrEqual(expectedRetry - 2)
    expect(result.retryAfterSecs).toBeLessThanOrEqual(expectedRetry + 2)
  })
})
