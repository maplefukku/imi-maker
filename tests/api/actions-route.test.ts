import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/glm', () => ({
  generateMeaning: vi.fn(),
  generateActions: vi.fn(),
}))

import { POST } from '@/app/api/actions/route'
import { generateActions } from '@/lib/glm'

const mockGenerateActions = vi.mocked(generateActions)

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  action: 'バイトした',
  meaningTitle: '人の感情を読む力',
  meaningBody: '接客って、相手が何を求めてるかを読むトレーニングかもね。',
}

const mockActions = [
  { id: '1', text: '今日の接客で印象に残った人を1人思い出してみる' },
  { id: '2', text: '次のシフトで1人だけ名前で呼んでみる' },
  { id: '3', text: '接客で使えるフレーズを3つメモしてみる' },
]

describe('POST /api/actions', () => {
  beforeEach(() => {
    mockGenerateActions.mockReset()
  })

  it('should return actions for valid request', async () => {
    mockGenerateActions.mockResolvedValueOnce(mockActions)

    const res = await POST(createRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.actions).toHaveLength(3)
    expect(data.actions[0].text).toContain('接客')
    expect(mockGenerateActions).toHaveBeenCalledWith(
      'バイトした',
      '人の感情を読む力',
      '接客って、相手が何を求めてるかを読むトレーニングかもね。',
    )
  })

  it('should return 400 when action is missing', async () => {
    const res = await POST(
      createRequest({ meaningTitle: 'a', meaningBody: 'b' }),
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('should return 400 when action is empty string', async () => {
    const res = await POST(
      createRequest({ action: '', meaningTitle: 'a', meaningBody: 'b' }),
    )
    expect(res.status).toBe(400)
  })

  it('should return 400 when meaningTitle is missing', async () => {
    const res = await POST(
      createRequest({ action: 'バイトした', meaningBody: 'b' }),
    )
    expect(res.status).toBe(400)
  })

  it('should return 400 when meaningBody is missing', async () => {
    const res = await POST(
      createRequest({ action: 'バイトした', meaningTitle: 'a' }),
    )
    expect(res.status).toBe(400)
  })

  it('should return 500 when generateActions fails', async () => {
    mockGenerateActions.mockRejectedValueOnce(
      new Error('GLM API error: 500 Internal Server Error'),
    )

    const res = await POST(createRequest(validBody))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('アクション提案の生成に失敗しました')
  })

  it('should include detail in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockGenerateActions.mockRejectedValueOnce(
      new Error('GLM API error: 500'),
    )

    const res = await POST(createRequest(validBody))
    const data = await res.json()
    expect(data.detail).toBe('GLM API error: 500')
    vi.unstubAllEnvs()
  })

  it('should not include detail in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockGenerateActions.mockRejectedValueOnce(
      new Error('GLM API error: 500'),
    )

    const res = await POST(createRequest(validBody))
    const data = await res.json()
    expect(data.detail).toBeUndefined()
    vi.unstubAllEnvs()
  })
})
