import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'sb-token', value: 'abc' }]),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('Supabase サーバークライアント', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('サーバー側クライアントを作成する', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
