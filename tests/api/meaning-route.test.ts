import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/glm', () => ({
  generateMeaning: vi.fn(),
}))

import { POST } from '@/app/api/meaning/route'
import { generateMeaning } from '@/lib/glm'

const mockGenerateMeaning = vi.mocked(generateMeaning)

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/meaning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/meaning', () => {
  beforeEach(() => {
    mockGenerateMeaning.mockReset()
  })

  it('should return meaning for valid action', async () => {
    mockGenerateMeaning.mockResolvedValueOnce({
      title: '人の感情を読む力',
      body: '接客って、相手が何を求めてるかを読むトレーニングかもね。',
    })

    const res = await POST(createRequest({ action: 'バイトした' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.meaning.title).toBe('人の感情を読む力')
    expect(data.meaning.body).toContain('接客')
    expect(mockGenerateMeaning).toHaveBeenCalledWith('バイトした', 'anything')
  })

  it('should return 400 when action is missing', async () => {
    const res = await POST(createRequest({}))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('should return 400 when action is empty string', async () => {
    const res = await POST(createRequest({ action: '' }))
    expect(res.status).toBe(400)
  })

  it('should return 400 when action exceeds 1000 chars', async () => {
    const longAction = 'あ'.repeat(1001)
    const res = await POST(createRequest({ action: longAction }))
    expect(res.status).toBe(400)
  })

  it('should return 500 with detail in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockGenerateMeaning.mockRejectedValueOnce(
      new Error('GLM API error: 500 Internal Server Error'),
    )

    const res = await POST(createRequest({ action: 'バイトした' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('意味の生成に失敗しました')
    expect(data.detail).toBe('GLM API error: 500 Internal Server Error')
    vi.unstubAllEnvs()
  })

  it('should return 500 without detail in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockGenerateMeaning.mockRejectedValueOnce(
      new Error('GLM API error: 500 Internal Server Error'),
    )

    const res = await POST(createRequest({ action: 'バイトした' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('意味の生成に失敗しました')
    expect(data.detail).toBeUndefined()
    vi.unstubAllEnvs()
  })

  it('should pass meaningType to generateMeaning', async () => {
    mockGenerateMeaning.mockResolvedValueOnce({
      title: 'テスト',
      body: 'テスト本文',
    })

    await POST(createRequest({ action: 'バイトした', meaningType: 'encourage' }))
    expect(mockGenerateMeaning).toHaveBeenCalledWith('バイトした', 'encourage')
  })

  it('should default to anything for invalid meaningType', async () => {
    mockGenerateMeaning.mockResolvedValueOnce({
      title: 'テスト',
      body: 'テスト本文',
    })

    await POST(createRequest({ action: 'バイトした', meaningType: 'invalid' }))
    expect(mockGenerateMeaning).toHaveBeenCalledWith('バイトした', 'anything')
  })

  it('should default to anything when meaningType is not provided', async () => {
    mockGenerateMeaning.mockResolvedValueOnce({
      title: 'テスト',
      body: 'テスト本文',
    })

    await POST(createRequest({ action: 'バイトした' }))
    expect(mockGenerateMeaning).toHaveBeenCalledWith('バイトした', 'anything')
  })
})
