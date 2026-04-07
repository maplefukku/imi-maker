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

import { GET } from '@/app/api/analyze-values/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

describe('GET /api/analyze-values', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('認証済みユーザーの価値観分析を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const mockMeanings = [
      { meaning: '成長できた' },
      { meaning: '成長を実感' },
      { meaning: '新しい挑戦をした' },
      { meaning: '仲間との絆' },
      { meaning: '感謝の気持ち' },
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
    expect(data.analysis).toBeDefined()
    expect(data.analysis.totalMeanings).toBe(5)
    expect(data.analysis.topValues.length).toBeGreaterThan(0)
  })

  it('5件未満の場合は空の分析結果を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [{ meaning: '成長' }], error: null }),
        }),
      }),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.analysis.topValues).toEqual([])
    expect(data.analysis.totalMeanings).toBe(1)
  })

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

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
