import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMeaning } from '@/lib/glm'

const mockFetch = vi.fn()
global.fetch = mockFetch

/** response.text() を返すモックを作るヘルパー */
function mockOkResponse(body: unknown) {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  }
}

describe('generateMeaning', () => {
  beforeEach(() => {
    vi.stubEnv('GLM_API_KEY', 'test-api-key')
    vi.stubEnv('GLM_BASE_URL', 'https://api.test.ai/v4/')
    vi.stubEnv('GLM_MODEL', 'glm-4.7')
    mockFetch.mockReset()
  })

  it('should call GLM API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '人の感情を読む力',
              body: '接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。',
            }),
          },
        }],
      }),
    )

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
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({
              title: '人の感情を読む力',
              body: '接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。',
            }),
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('人の感情を読む力')
    expect(result.body).toBe('接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。')
  })

  it('should parse JSON wrapped in markdown code block', async () => {
    const jsonContent = JSON.stringify({
      title: '人の感情を読む力',
      body: '接客って、相手が何を求めてるかを一瞬で読むトレーニングかもね。',
    })
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```json\n' + jsonContent + '\n```',
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('人の感情を読む力')
    expect(result.body).toContain('接客')
  })

  it('should parse JSON wrapped in plain code block', async () => {
    const jsonContent = JSON.stringify({
      title: 'テスト',
      body: 'テスト本文',
    })
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```\n' + jsonContent + '\n```',
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('テスト')
    expect(result.body).toBe('テスト本文')
  })

  it('should fall back to plain text for non-JSON content', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: 'これはJSONではないレスポンスです',
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('見つけた意味')
    expect(result.body).toBe('これはJSONではないレスポンスです')
  })

  it('should throw on empty content', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: null,
          },
        }],
      }),
    )

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: no content in response',
    )
  })

  it('should throw on API error with status text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '{"error": "server failure"}',
    })

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: 500 Internal Server Error',
    )
  })

  it('should throw on invalid JSON response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<html>Not JSON</html>',
    })

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: invalid JSON response',
    )
  })

  it('should throw when response body cannot be read', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => { throw new Error('network error') },
    })

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: failed to read response body',
    )
  })

  it('should throw on unexpected response structure (no choices)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({ result: 'unexpected' }),
    )

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: no content in response',
    )
  })

  it('should extract JSON from reasoning_content when content is empty', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '',
            reasoning_content: '思考プロセス... {"title":"テスト","body":"テスト本文"} ...',
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('テスト')
    expect(result.body).toBe('テスト本文')
  })

  it('should throw when reasoning_content has invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '',
            reasoning_content: '思考プロセス... invalid json ...',
          },
        }],
      }),
    )

    await expect(generateMeaning('バイトした')).rejects.toThrow(
      'GLM API error: no content in response',
    )
  })

  it('should fall back to plain text when code block JSON is invalid', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```json\n{invalid json}\n```',
          },
        }],
      }),
    )

    const result = await generateMeaning('バイトした')
    expect(result.title).toBe('見つけた意味')
    expect(result.body).toContain('invalid')
  })

  it('should throw when API key is missing', async () => {
    vi.stubEnv('GLM_API_KEY', '')

    await expect(generateMeaning('バイトした')).rejects.toThrow('GLM_API_KEY')
  })

  it('should include encourage instruction in system prompt', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    )

    await generateMeaning('バイトした', 'encourage')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].content).toContain('励まし')
  })

  it('should include insight instruction in system prompt', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    )

    await generateMeaning('バイトした', 'insight')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].content).toContain('気づいていない')
  })

  it('should include action instruction in system prompt', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    )

    await generateMeaning('バイトした', 'action')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].content).toContain('行動指針')
  })

  it('should not add extra instruction for anything type', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    )

    await generateMeaning('バイトした', 'anything')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].content).not.toContain('追加指示')
  })

  it('should use default base URL when env is not set', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('GLM_API_KEY', 'test-api-key')

    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'テスト', body: 'テスト本文' }),
          },
        }],
      }),
    )

    await generateMeaning('テスト')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.z.ai/api/coding/paas/v4/chat/completions',
      expect.anything(),
    )
  })
})
