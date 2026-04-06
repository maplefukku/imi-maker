import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'sb-token', value: 'abc' }]),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url: string, key: string, options: { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } }) => {
    // cookiesオプションが正しく渡されていることを確認
    const allCookies = options.cookies.getAll()
    return {
      supabaseUrl: url,
      supabaseKey: key,
      cookies: allCookies,
      auth: { getSession: vi.fn() },
    }
  }),
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
    expect(client.supabaseUrl).toBe('https://test.supabase.co')
    expect(client.supabaseKey).toBe('test-anon-key')
  })

  it('cookieStoreと連携する', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client.cookies).toEqual([{ name: 'sb-token', value: 'abc' }])
  })
})
