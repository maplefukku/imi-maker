import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()
let capturedCookiesConfig: { getAll: () => unknown; setAll: (cookies: unknown[]) => void } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, options: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = options.cookies
    return {
      auth: {
        getUser: mockGetUser,
      },
    }
  }),
}))

describe('ミドルウェア', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    mockGetUser.mockReset()
  })

  it('公開パスはそのまま通過する', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { middleware } = await import('@/middleware')

    const request = new NextRequest('http://localhost:3000/')
    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })

  it('未認証ユーザーが /history にアクセスするとリダイレクトされる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { middleware } = await import('@/middleware')

    const request = new NextRequest('http://localhost:3000/history')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('認証済みユーザーは /history にアクセスできる', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    const { middleware } = await import('@/middleware')

    const request = new NextRequest('http://localhost:3000/history')
    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })

  it('matcher設定がエクスポートされている', async () => {
    const { config } = await import('@/middleware')
    expect(config.matcher).toBeDefined()
    expect(config.matcher).toHaveLength(1)
  })
})

describe('updateSession cookie処理', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    mockGetUser.mockReset()
    capturedCookiesConfig = null
  })

  it('getAll がリクエストのcookieを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { updateSession } = await import('@/lib/supabase/middleware')

    const request = new NextRequest('http://localhost:3000/')
    request.cookies.set('sb-token', 'test-value')
    await updateSession(request)

    expect(capturedCookiesConfig).not.toBeNull()
    const cookies = capturedCookiesConfig!.getAll()
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'sb-token', value: 'test-value' }),
      ])
    )
  })

  it('setAll がリクエストとレスポンスのcookieを更新する', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { updateSession } = await import('@/lib/supabase/middleware')

    const request = new NextRequest('http://localhost:3000/')
    await updateSession(request)

    expect(capturedCookiesConfig).not.toBeNull()
    capturedCookiesConfig!.setAll([
      { name: 'sb-new', value: 'new-value', options: { path: '/' } },
    ])

    expect(request.cookies.get('sb-new')?.value).toBe('new-value')
  })
})
