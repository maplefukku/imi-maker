import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

import { GET, POST } from '@/app/api/meanings/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

function createPostRequest(body: unknown): Request {
  return new Request('http://localhost/api/meanings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/meanings', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('認証済みユーザーの履歴を取得できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const mockMeanings = [
      { id: '1', action: 'バイトした', meaning: '成長', created_at: '2026-01-01' },
      { id: '2', action: '勉強した', meaning: '知識', created_at: '2026-01-02' },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMeanings, error: null }),
        }),
      }),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.meanings).toHaveLength(2)
    expect(data.meanings[0].action).toBe('バイトした')
    expect(mockFrom).toHaveBeenCalledWith('meanings')
  })

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('認証エラーの場合401を返す', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('Supabaseエラーの場合500を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})

describe('POST /api/meanings', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('意味を保存できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const savedMeaning = {
      id: '1',
      user_id: 'user-123',
      action: 'バイトした',
      meaning: '人の感情を読む力',
      suggestions: ['接客業', 'カウンセラー'],
    }

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: savedMeaning, error: null }),
        }),
      }),
    })

    const res = await POST(
      createPostRequest({
        action: 'バイトした',
        meaning: '人の感情を読む力',
        suggestions: ['接客業', 'カウンセラー'],
      })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.meaning.action).toBe('バイトした')
    expect(data.meaning.suggestions).toHaveLength(2)
  })

  it('suggestionsが省略された場合は空配列で保存される', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', action: 'テスト', meaning: '学び', suggestions: [] },
          error: null,
        }),
      }),
    })

    mockFrom.mockReturnValue({ insert: insertMock })

    const res = await POST(
      createPostRequest({ action: 'テスト', meaning: '学び' })
    )

    expect(res.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ suggestions: [] })
    )
  })

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(
      createPostRequest({ action: 'バイトした', meaning: '成長' })
    )
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('Supabaseエラーの場合500を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        }),
      }),
    })

    const res = await POST(
      createPostRequest({ action: 'バイトした', meaning: '成長' })
    )
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Insert failed')
  })
})
