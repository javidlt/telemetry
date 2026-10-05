import { describe, it, expect, vi } from 'vitest'
import worker from './index'

type Member = { id: number; email: string; name: string; available: number }

function buildEnv(members: Member[]): Env {
  const all = vi.fn().mockResolvedValue({ results: members })
  const prepare = vi.fn().mockReturnValue({ all })
  return {
    ONCALL_DB: { prepare } as unknown as D1Database,
  } as unknown as Env
}

function buildEnvWithUndefinedResults(): Env {
  const all = vi.fn().mockResolvedValue({})
  const prepare = vi.fn().mockReturnValue({ all })
  return {
    ONCALL_DB: { prepare } as unknown as D1Database,
  } as unknown as Env
}

const ctx = {} as ExecutionContext

describe('Worker fetch handler', () => {
  it('returns members from D1 on GET /api/members', async () => {
    const members: Member[] = [
      { id: 1, email: 'a@example.com', name: 'Ana', available: 1 },
      { id: 2, email: 'b@example.com', name: 'Beto', available: 0 },
    ]
    const env = buildEnv(members)
    const res = await worker.fetch(new Request('https://x.test/api/members'), env, ctx)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { members: Member[] }
    expect(body).toEqual({ members })
    const prepare = (env.ONCALL_DB as unknown as { prepare: ReturnType<typeof vi.fn> }).prepare
    expect(prepare).toHaveBeenCalledWith(
      'SELECT id, email, name, available FROM members ORDER BY id ASC'
    )
  })

  it('returns an empty members array when D1 returns undefined results', async () => {
    const env = buildEnvWithUndefinedResults()
    const res = await worker.fetch(new Request('https://x.test/api/members'), env, ctx)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ members: [] })
  })

  it('returns default JSON on any other /api/* route', async () => {
    const env = buildEnv([])
    const res = await worker.fetch(new Request('https://x.test/api/anything'), env, ctx)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'Cloudflare' })
  })

  it('returns 404 for non-api paths', async () => {
    const env = buildEnv([])
    const res = await worker.fetch(new Request('https://x.test/'), env, ctx)
    expect(res.status).toBe(404)
    const text = await res.text()
    expect(text).toBe('')
  })

  it('returns 404 for other non-api paths', async () => {
    const env = buildEnv([])
    const res = await worker.fetch(new Request('https://x.test/some/page'), env, ctx)
    expect(res.status).toBe(404)
  })
})
