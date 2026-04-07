import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateDeepDiveQuestions, generateDeepDiveMeaning } from '@/lib/glm'

const mockFetch = vi.fn()
global.fetch = mockFetch

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  }
}

const mockQuestionsArray = [
  { id: '1', text: 'その作業をしているとき、どんな気持ちだった？' },
  { id: '2', text: '似たようなことを前にもやったことある？' },
  { id: '3', text: 'それを誰かに話したくなったりする？' },
]

const mockMeaning = {
  title: '好奇心の種',
  body: '新しいことに手を出すって、自分の中の「もっと知りたい」に素直になってるのかもね。',
}

describe('generateDeepDiveQuestions', () => {
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
          message: { content: JSON.stringify(mockQuestionsArray) },
        }],
      }),
    )

    await generateDeepDiveQuestions('バイトした', '人の感情を読む力', '接客トレーニングかもね')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.ai/v4/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].role).toBe('system')
    const lastMessage = body.messages[body.messages.length - 1]
    expect(lastMessage.content).toContain('バイトした')
    expect(lastMessage.content).toContain('人の感情を読む力')
  })

  it('should return parsed questions from valid JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: JSON.stringify(mockQuestionsArray) },
        }],
      }),
    )

    const result = await generateDeepDiveQuestions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('1')
    expect(result[0].text).toContain('気持ち')
  })

  it('should include conversation history in messages', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: JSON.stringify(mockQuestionsArray) },
        }],
      }),
    )

    const conversation = [
      { role: 'user' as const, content: '前の質問への回答' },
      { role: 'assistant' as const, content: '前の応答' },
    ]

    await generateDeepDiveQuestions('バイトした', 'タイトル', '本文', conversation)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages).toHaveLength(4) // system + 2 conversation + user
    expect(body.messages[1].content).toBe('前の質問への回答')
    expect(body.messages[2].content).toBe('前の応答')
  })

  it('should parse JSON from markdown code block', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```json\n' + JSON.stringify(mockQuestionsArray) + '\n```',
          },
        }],
      }),
    )

    const result = await generateDeepDiveQuestions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
  })

  it('should extract from reasoning_content when content is empty', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '',
            reasoning_content: '思考中... ' + JSON.stringify(mockQuestionsArray) + ' ...',
          },
        }],
      }),
    )

    const result = await generateDeepDiveQuestions('バイトした', 'タイトル', '本文')
    expect(result).toHaveLength(3)
  })

  it('should throw when API key is missing', async () => {
    vi.stubEnv('GLM_API_KEY', '')

    await expect(
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
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
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('GLM API error: 500')
  })

  it('should throw when content is empty and no reasoning', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{ message: { content: '' } }],
      }),
    )

    await expect(
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
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
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('failed to parse deep dive response')
  })

  it('should throw on invalid JSON response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<html>Not JSON</html>',
    })

    await expect(
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('GLM API error: invalid JSON response')
  })

  it('should throw when response body cannot be read', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => { throw new Error('network error') },
    })

    await expect(
      generateDeepDiveQuestions('バイトした', 'タイトル', '本文'),
    ).rejects.toThrow('GLM API error: failed to read response body')
  })
})

describe('generateDeepDiveMeaning', () => {
  beforeEach(() => {
    vi.stubEnv('GLM_API_KEY', 'test-api-key')
    vi.stubEnv('GLM_BASE_URL', 'https://api.test.ai/v4/')
    vi.stubEnv('GLM_MODEL', 'glm-4.7')
    mockFetch.mockReset()
  })

  it('should call GLM API with conversation history', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: JSON.stringify(mockMeaning) },
        }],
      }),
    )

    const conversation = [
      { role: 'user' as const, content: '質問への回答' },
      { role: 'assistant' as const, content: '応答' },
    ]

    await generateDeepDiveMeaning('バイトした', conversation)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.ai/v4/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].content).toBe('質問への回答')
    expect(body.messages[2].content).toBe('応答')
    const lastMessage = body.messages[body.messages.length - 1]
    expect(lastMessage.content).toContain('バイトした')
  })

  it('should return parsed title and body from valid JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: JSON.stringify(mockMeaning) },
        }],
      }),
    )

    const result = await generateDeepDiveMeaning('バイトした', [])
    expect(result.title).toBe('好奇心の種')
    expect(result.body).toContain('知りたい')
  })

  it('should parse JSON from markdown code block', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: {
            content: '```json\n' + JSON.stringify(mockMeaning) + '\n```',
          },
        }],
      }),
    )

    const result = await generateDeepDiveMeaning('バイトした', [])
    expect(result.title).toBe('好奇心の種')
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

    const result = await generateDeepDiveMeaning('バイトした', [])
    expect(result.title).toBe('テスト')
    expect(result.body).toBe('テスト本文')
  })

  it('should fall back to plain text for non-JSON content', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{
          message: { content: 'これはJSONではないレスポンスです' },
        }],
      }),
    )

    const result = await generateDeepDiveMeaning('バイトした', [])
    expect(result.title).toBe('新たな意味')
    expect(result.body).toBe('これはJSONではないレスポンスです')
  })

  it('should throw when API key is missing', async () => {
    vi.stubEnv('GLM_API_KEY', '')

    await expect(
      generateDeepDiveMeaning('バイトした', []),
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
      generateDeepDiveMeaning('バイトした', []),
    ).rejects.toThrow('GLM API error: 500')
  })

  it('should throw when content is empty and no reasoning', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse({
        choices: [{ message: { content: '' } }],
      }),
    )

    await expect(
      generateDeepDiveMeaning('バイトした', []),
    ).rejects.toThrow('no content')
  })

  it('should throw on invalid JSON response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<html>Not JSON</html>',
    })

    await expect(
      generateDeepDiveMeaning('バイトした', []),
    ).rejects.toThrow('GLM API error: invalid JSON response')
  })

  it('should throw when response body cannot be read', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => { throw new Error('network error') },
    })

    await expect(
      generateDeepDiveMeaning('バイトした', []),
    ).rejects.toThrow('GLM API error: failed to read response body')
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

    const result = await generateDeepDiveMeaning('バイトした', [])
    expect(result.title).toBe('新たな意味')
    expect(result.body).toContain('invalid')
  })
})
