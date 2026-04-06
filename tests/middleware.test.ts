import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetSession = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, _options: unknown) => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}))

describe('ミドルウェア', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    mockGetSession.mockReset()
  })

  it('公開パスはそのまま通過する', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { middleware } = await import('@/middleware')

    const request = new NextRequest('http://localhost:3000/')
    const response = await middleware(request)

    expect(response.status).not.toBe(307)
  })

  it('未認証ユーザーが /history にアクセスするとリダイレクトされる', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { middleware } = await import('@/middleware')

    const request = new NextRequest('http://localhost:3000/history')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('認証済みユーザーは /history にアクセスできる', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
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
