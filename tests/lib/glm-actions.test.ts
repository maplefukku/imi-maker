import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateActions } from '@/lib/glm'

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  }
}

const mockActionsArray = [
  { id: '1', text: '今日の接客で印象に残った人を思い出す' },
  { id: '2', text: '次のシフトで名前で呼んでみる' },
  { id: '3', text: '接客フレーズを3つメモする' },
]

describe('generateActions', () => {
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
          message: { content: JSON.stringify(mockActionsArray) },
        }],
      }),
    )

    await generateActions('バイトした', '人の感情を読む力', '接客トレーニングかもね')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.ai/v4/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[1].content).toContain('バイトした')
    expect(body.messages[1].content).toContain('人の感情を読む力')
  })

  it('should return parsed actions from valid JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: JSON.stringify(mockActionsArray) },
        }],
      }),
    )

    const result = await generateActions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('1')
    expect(result[0].text).toContain('接客')
  })

  it('should parse JSON from markdown code block', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```json\n' + JSON.stringify(mockActionsArray) + '\n```',
          },
        }],
      }),
    )

    const result = await generateActions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
  })

  it('should extract from reasoning_content when content is empty', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '',
            reasoning_content: '思考中... ' + JSON.stringify(mockActionsArray) + ' ...',
          },
        }],
      }),
    )

    const result = await generateActions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
  })

  it('should throw when API key is missing', async () => {
    vi.stubEnv('GLM_API_KEY', '')

    await expect(
      generateActions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('GLM_API_KEY')
  })

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'error',
    })

    await expect(
      generateActions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('GLM API error: 500')
  })

  it('should throw when content is empty and no reasoning', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{ message: { content: '' } }],
      }),
    )

    await expect(
      generateActions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('no content')
  })

  it('should throw when content is not valid JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: 'これはJSONじゃない' },
        }],
      }),
    )

    await expect(
      generateActions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('failed to parse actions')
  })
})
