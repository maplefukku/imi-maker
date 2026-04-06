import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'sb-token', value: 'abc' }]),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

let capturedCookiesConfig: { getAll: () => unknown; setAll: (cookies: unknown[]) => void } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = options.cookies
    return {
      auth: { getSession: vi.fn() },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      })),
    }
  }),
}))

describe('Supabase サーバークライアント', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    capturedCookiesConfig = null
    mockCookieStore.getAll.mockClear()
    mockCookieStore.set.mockClear()
  })

  it('サーバー側クライアントを作成する', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })

  it('getAll がcookieStoreからcookieを返す', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    expect(capturedCookiesConfig).not.toBeNull()
    const cookies = capturedCookiesConfig!.getAll()
    expect(cookies).toEqual([{ name: 'sb-token', value: 'abc' }])
    expect(mockCookieStore.getAll).toHaveBeenCalled()
  })

  it('setAll がcookieStoreにcookieを設定する', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    expect(capturedCookiesConfig).not.toBeNull()
    capturedCookiesConfig!.setAll([
      { name: 'sb-new', value: 'new-val', options: { path: '/' } },
    ])
    expect(mockCookieStore.set).toHaveBeenCalledWith('sb-new', 'new-val', { path: '/' })
  })

  it('setAll がServer Component内でエラーを無視する', async () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    })

    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    expect(capturedCookiesConfig).not.toBeNull()
    expect(() => {
      capturedCookiesConfig!.setAll([
        { name: 'sb-err', value: 'val', options: {} },
      ])
    }).not.toThrow()
  })
})
