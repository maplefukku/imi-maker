import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url: string, key: string) => ({
    supabaseUrl: url,
    supabaseKey: key,
    auth: { getSession: vi.fn() },
  })),
}))

describe('Supabase ブラウザクライアント', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('環境変数を使ってクライアントを作成する', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.supabaseUrl).toBe('https://test.supabase.co')
    expect(client.supabaseKey).toBe('test-anon-key')
  })
})
