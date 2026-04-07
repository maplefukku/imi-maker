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

import { DELETE, GET } from '@/app/api/meanings/[id]/route'

const mockUser = { id: 'user-123', email: 'test@example.com' }

function createGetRequest(): Request {
  return new Request('http://localhost/api/meanings/meaning-1', {
    method: 'GET',
  })
}

function createDeleteRequest(): Request {
  return new Request('http://localhost/api/meanings/meaning-1', {
    method: 'DELETE',
  })
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/meanings/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('意味を取得できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const mockMeaning = {
      id: 'meaning-1',
      user_id: 'user-123',
      action: 'バイトした',
      meaning: '人の感情を読む力',
      title: 'テストタイトル',
      created_at: '2025-01-01',
    }

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMeaning, error: null }),
          }),
        }),
      }),
    })

    const res = await GET(createGetRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.meaning).toEqual(mockMeaning)
  })

  it('GET - 未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await GET(createGetRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('GET - 見つからない場合404を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    })

    const res = await GET(createGetRequest(), createParams('nonexistent'))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('見つかりませんでした')
  })
})

describe('DELETE /api/meanings/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it('意味を削除できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    const res = await DELETE(createDeleteRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('meanings')
  })

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await DELETE(createDeleteRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('認証エラーの場合401を返す', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Session expired'),
    })

    const res = await DELETE(createDeleteRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('認証が必要です')
  })

  it('Supabaseエラーの場合500を返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      }),
    })

    const res = await DELETE(createDeleteRequest(), createParams('meaning-1'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Delete failed')
  })

  it('異なるIDで削除リクエストを送信できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

    const eqUserMock = vi.fn().mockResolvedValue({ error: null })
    const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock })
    const deleteMock = vi.fn().mockReturnValue({ eq: eqIdMock })

    mockFrom.mockReturnValue({ delete: deleteMock })

    const res = await DELETE(createDeleteRequest(), createParams('another-id'))

    expect(res.status).toBe(200)
    expect(eqIdMock).toHaveBeenCalledWith('id', 'another-id')
    expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-123')
  })
})
