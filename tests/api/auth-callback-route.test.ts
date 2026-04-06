import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })
  ),
}))

describe('API認証コールバック /api/auth/callback', () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset()
  })

  it('有効なcodeでセッション交換に成功するとリダイレクトする', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('@/app/api/auth/callback/route')

    const request = new Request('http://localhost:3000/api/auth/callback?code=valid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('nextパラメータ付きでリダイレクト先を指定できる', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('@/app/api/auth/callback/route')

    const request = new Request('http://localhost:3000/api/auth/callback?code=valid-code&next=/history')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/history')
  })

  it('codeがない場合はエラー付きでリダイレクトする', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const request = new Request('http://localhost:3000/api/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth')
  })

  it('セッション交換に失敗した場合はエラー付きでリダイレクトする', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('Invalid code') })
    const { GET } = await import('@/app/api/auth/callback/route')

    const request = new Request('http://localhost:3000/api/auth/callback?code=invalid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth')
  })
})
