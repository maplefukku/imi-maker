import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMeaning } from '@/lib/glm'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('generateMeaning', () => {
  beforeEach(() => {
    vi.stubEnv('GLM_API_KEY', 'test-api-key')
    vi.stubEnv('GLM_BASE_URL', 'https://api.test.ai/v4/')
    vi.stubEnv('GLM_MODEL', 'glm-4.7')
    mockFetch.mockReset()
  })

  it('should call GLM API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '人の感情を読む力',
              body: '接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。',
            }),
          },
        }],
      }),
    })

    await generateMeaning('バイトした')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.ai/v4/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
      }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.model).toBe('glm-4.7')
    expect(body.messages).toHaveLength(2)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
    expect(body.messages[1].content).toContain('バイトした')
  })

  it('should return parsed title and body from valid JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '人の感情を読む力',
              body: '接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。',
            }),
          },
        }],
      }),
    })

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('人の感情を読む力')
    expect(result.body).toBe('接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。')
  })

  it('should handle non-JSON response with fallback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'これはJSONではないレスポンスです',
          },
        }],
      }),
    })

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('見つけた意味')
    expect(result.body).toBe('これはJSONではないレスポンスです')
  })

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(generateMeaning('バイトした')).rejects.toThrow('GLM API error: 500')
  })

  it('should throw when API key is missing', async () => {
    vi.stubEnv('GLM_API_KEY', '')

    await expect(generateMeaning('バイトした')).rejects.toThrow('GLM_API_KEY')
  })

  it('should use default base URL when env is not set', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('GLM_API_KEY', 'test-api-key')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    })

    await generateMeaning('テスト')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.z.ai/api/coding/paas/v4/chat/completions',
      expect.anything(),
    )
  })
})
