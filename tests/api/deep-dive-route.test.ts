import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/glm', () => ({
  generateMeaning: vi.fn(),
  generateActions: vi.fn(),
  generateDeepDiveQuestions: vi.fn(),
  generateDeepDiveMeaning: vi.fn(),
}))

import { POST } from '@/app/api/deep-dive/route'
import { generateDeepDiveQuestions, generateDeepDiveMeaning } from '@/lib/glm'

const mockGenerateQuestions = vi.mocked(generateDeepDiveQuestions)
const mockGenerateMeaning = vi.mocked(generateDeepDiveMeaning)

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/deep-dive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  action: 'バイトした',
  meaningTitle: '人の感情を読む力',
  meaningBody: '接客を通じて相手の気持ちを察する力が育ってるのかも。',
}

const mockQuestions = [
  { id: '1', text: 'この経験で誰かに感謝したい人はいますか？' },
  { id: '2', text: 'もしこの経験がなければ、今の何が変わっていましたか？' },
  { id: '3', text: 'この意味は、あなたの将来のどんな場面で活きそうですか？' },
]

const mockMeaning = {
  title: '信頼を育てる力',
  body: '相手の気持ちに寄り添えるってことは、信頼関係を築く土台になってるのかもね。',
}

describe('POST /api/deep-dive', () => {
  beforeEach(() => {
    mockGenerateQuestions.mockReset()
    mockGenerateMeaning.mockReset()
  })

  it('should return questions for valid request (default mode)', async () => {
    mockGenerateQuestions.mockResolvedValueOnce(mockQuestions)

    const res = await POST(createRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.questions).toHaveLength(3)
    expect(data.questions[0].text).toContain('感謝')
  })

  it('should return questions when mode is "questions"', async () => {
    mockGenerateQuestions.mockResolvedValueOnce(mockQuestions)

    const res = await POST(createRequest({ ...validBody, mode: 'questions' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.questions).toHaveLength(3)
  })

  it('should return meaning when mode is "meaning"', async () => {
    mockGenerateMeaning.mockResolvedValueOnce(mockMeaning)

    const res = await POST(createRequest({ ...validBody, mode: 'meaning' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.meaning.title).toBe('信頼を育てる力')
    expect(data.meaning.body).toContain('信頼関係')
  })

  it('should pass conversation history to questions', async () => {
    mockGenerateQuestions.mockResolvedValueOnce(mockQuestions)
    const conversation = [
      { role: 'assistant' as const, content: '意味1' },
      { role: 'user' as const, content: '質問1' },
    ]

    await POST(createRequest({ ...validBody, conversation }))

    expect(mockGenerateQuestions).toHaveBeenCalledWith(
      'バイトした',
      '人の感情を読む力',
      '接客を通じて相手の気持ちを察する力が育ってるのかも。',
      conversation,
    )
  })

  it('should pass conversation history to meaning', async () => {
    mockGenerateMeaning.mockResolvedValueOnce(mockMeaning)
    const conversation = [
      { role: 'assistant' as const, content: '意味1' },
      { role: 'user' as const, content: '質問1' },
    ]

    await POST(createRequest({ ...validBody, mode: 'meaning', conversation }))

    expect(mockGenerateMeaning).toHaveBeenCalledWith(
      'バイトした',
      conversation,
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

  it('should return 500 when generateDeepDiveQuestions fails', async () => {
    mockGenerateQuestions.mockRejectedValueOnce(
      new Error('GLM API error: 500 Internal Server Error'),
    )

    const res = await POST(createRequest(validBody))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('深掘りの生成に失敗しました')
  })

  it('should return 500 when generateDeepDiveMeaning fails', async () => {
    mockGenerateMeaning.mockRejectedValueOnce(
      new Error('GLM API error: 500'),
    )

    const res = await POST(createRequest({ ...validBody, mode: 'meaning' }))
    expect(res.status).toBe(500)
  })

  it('should include detail in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    mockGenerateQuestions.mockRejectedValueOnce(
      new Error('GLM API error: 500'),
    )

    const res = await POST(createRequest(validBody))
    const data = await res.json()
    expect(data.detail).toBe('GLM API error: 500')
    vi.unstubAllEnvs()
  })

  it('should not include detail in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockGenerateQuestions.mockRejectedValueOnce(
      new Error('GLM API error: 500'),
    )

    const res = await POST(createRequest(validBody))
    const data = await res.json()
    expect(data.detail).toBeUndefined()
    vi.unstubAllEnvs()
  })
})
