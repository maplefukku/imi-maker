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

describe('認証コールバック', () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset()
  })

  it('有効なcodeでセッション交換に成功するとリダイレクトする', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('@/app/auth/callback/route')

    const request = new Request('http://localhost:3000/auth/callback?code=valid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('nextパラメータ付きでリダイレクト先を指定できる', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('@/app/auth/callback/route')

    const request = new Request('http://localhost:3000/auth/callback?code=valid-code&next=/history')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/history')
  })

  it('codeがない場合はホームにリダイレクトする', async () => {
    const { GET } = await import('@/app/auth/callback/route')

    const request = new Request('http://localhost:3000/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })

  it('セッション交換に失敗した場合はホームにリダイレクトする', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('Invalid code') })
    const { GET } = await import('@/app/auth/callback/route')

    const request = new Request('http://localhost:3000/auth/callback?code=invalid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })
})
