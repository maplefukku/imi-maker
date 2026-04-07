import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

import { GET, POST } from '@/app/api/analytics/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/analytics', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('イベントを記録できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })

    const res = await POST(
      createPostRequest({ type: 'meaning_generated', data: { actionLength: 10 } })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('analytics_events')
  })

  it('未認証でもイベントを記録できる（user_idはnull）', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const res = await POST(
      createPostRequest({ type: 'history_viewed' })
    )

    expect(res.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    )
  })

  it('イベントタイプがない場合400を返す', async () => {
    const res = await POST(createPostRequest({}))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('イベントタイプが必要です')
  })

  it('無効なイベントタイプの場合400を返す', async () => {
    const res = await POST(createPostRequest({ type: 'invalid_type' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('無効なイベントタイプです')
  })

  it('Supabase挿入エラーの場合500を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
    })

    const res = await POST(
      createPostRequest({ type: 'shared', data: { platform: 'twitter' } })
    )
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('イベントの記録に失敗しました')
  })

  it('不正なJSONの場合400を返す', async () => {
    const req = new NextRequest('http://localhost/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('session_viewedイベントを記録できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const res = await POST(
      createPostRequest({ type: 'session_viewed', data: { meaningId: 'abc' } })
    )

    expect(res.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'session_viewed',
        event_data: { meaningId: 'abc' },
      })
    )
  })
})

describe('GET /api/analytics', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('認証済みユーザーが統計を取得できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const now = new Date().toISOString()
    const mockEvents = [
      { event_type: 'meaning_generated', created_at: now, event_data: {} },
      { event_type: 'meaning_generated', created_at: now, event_data: {} },
      { event_type: 'shared', created_at: now, event_data: {} },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        }),
      }),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.stats.total).toBe(3)
    expect(data.stats.byType.meaning_generated).toBe(2)
    expect(data.stats.byType.shared).toBe(1)
    expect(data.stats.last24h).toBe(3)
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
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Query failed' },
          }),
        }),
      }),
    })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Query failed')
  })
})
