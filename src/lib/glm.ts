const DEEP_DIVE_QUESTIONS_PROMPT = `あなたは「意味メーカー」のAIです。ユーザーが見つけた意味をさらに深掘りするための質問を3つ生成します。

ルール:
- ユーザーが自分自身について新たな気づきを得られる質問
- 答えやすく、でも少し考えさせる問い
- 説教しない。義務感を与えない
- 「〜ですか？」「〜かも？」のような柔らかい表現
- JSON配列で返す: [{"id": "1", "text": "..."}, {"id": "2", "text": "..."}, {"id": "3", "text": "..."}]
- textは60文字以内`

const DEEP_DIVE_MEANING_PROMPT = `あなたは「意味メーカー」のAIです。会話の流れを踏まえて、ユーザーの行動からさらに深い意味を見つけます。

ルール:
- 見出し（10文字以内）と本文（80-120文字）で返す
- 前回の意味とは異なる新しい視点を提供する
- 説教しない。「すごい」「えらい」も言わない
- 「かもね」「〜してるのかも」のような柔らかい語尾
- 具体的なスキルや力に紐づける
- 楽しげに、軽く
- JSON形式で返す: {"title": "...", "body": "..."}`

const ACTIONS_SYSTEM_PROMPT = `あなたは「意味メーカー」のAIです。ユーザーが見つけた意味をもとに、すぐに実行できる小さなアクションを3つ提案します。

ルール:
- 15分〜1時間でできる軽量なアクションのみ
- 具体的で、今日すぐ始められること
- 説教しない。義務感を与えない
- 「〜してみる」「〜を試す」のような軽い表現
- JSON配列で返す: [{"id": "1", "text": "..."}, {"id": "2", "text": "..."}, {"id": "3", "text": "..."}]
- textは40文字以内`

const BASE_SYSTEM_PROMPT = `あなたは「意味メーカー」のAIです。ユーザーが今日やったことを入力します。
あなたの仕事は、その行動が将来どう役立つ可能性があるかを、肯定的に・押し付けがましくなく解釈することです。

ルール:
- 見出し（10文字以内）と本文（80-120文字）で返す
- 説教しない。「すごい」「えらい」も言わない
- 「かもね」「〜してるのかも」のような柔らかい語尾
- 具体的なスキルや力に紐づける
- 楽しげに、軽く
- JSON形式で返す: {"title": "...", "body": "..."}`

const MEANING_TYPE_INSTRUCTIONS: Record<string, string> = {
  encourage: '\n\n追加指示: 励ましのトーンで、ユーザーの行動を肯定的に後押しするように回答してください。',
  insight: '\n\n追加指示: ユーザーが気づいていない視点や発見を提供するように回答してください。',
  action: '\n\n追加指示: 次に取れる具体的な行動指針を含めて回答してください。',
}

function buildSystemPrompt(meaningType: string): string {
  return BASE_SYSTEM_PROMPT + (MEANING_TYPE_INSTRUCTIONS[meaningType] || '')
}

export async function generateMeaning(
  action: string,
  meaningType: string = 'anything',
): Promise<{ title: string; body: string }> {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    throw new Error('GLM_API_KEY is not set')
  }

  const baseUrl =
    process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4/'
  const model = process.env.GLM_MODEL || 'glm-4.7'

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(meaningType) },
        { role: 'user', content: `今日やったこと: ${action}` },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    let errorBody: string | undefined
    try {
      errorBody = await response.text()
    } catch {
      // レスポンスボディの読み取りに失敗
    }
    console.error('[GLM API] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: `${baseUrl}chat/completions`,
      model,
      body: errorBody,
    })
    throw new Error(
      `GLM API error: ${response.status} ${response.statusText}`,
    )
  }

  let rawText: string
  try {
    rawText = await response.text()
  } catch (e) {
    console.error('[GLM API] Failed to read response body:', e)
    throw new Error('GLM API error: failed to read response body')
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error(
      '[GLM API] Response is not valid JSON:',
      rawText.slice(0, 500),
    )
    throw new Error('GLM API error: invalid JSON response')
  }

  const choices = data.choices as
    | Array<{
        message?: { content?: string; reasoning_content?: string }
      }>
    | undefined
  const message = choices?.[0]?.message
  const content = message?.content?.trim() || null

  if (!content) {
    // GLM-4.7は推論モデル: reasoning_contentにCoTを出力し、max_tokensが足りないとcontentが空になる
    // reasoning_contentからJSON抽出を試みる
    const reasoning = message?.reasoning_content
    if (reasoning) {
      const jsonMatch = reasoning.match(
        /\{\s*"title"\s*:\s*"[^"]*"\s*,\s*"body"\s*:\s*"[^"]*"\s*\}/,
      )
      if (jsonMatch) {
        console.warn(
          '[GLM API] content empty, extracted JSON from reasoning_content',
        )
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          // fall through
        }
      }
    }
    console.error(
      '[GLM API] Unexpected response structure:',
      JSON.stringify(data).slice(0, 500),
    )
    throw new Error('GLM API error: no content in response')
  }

  try {
    return JSON.parse(content)
  } catch {
    // マークダウンコードブロックで囲まれたJSONを抽出して再パース
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim())
      } catch {
        console.error('[GLM API] Failed to parse JSON from code block:', {
          raw: content.slice(0, 200),
          extracted: codeBlockMatch[1].trim().slice(0, 200),
        })
      }
    }

    console.warn(
      '[GLM API] Content is not JSON, using as plain text:',
      content.slice(0, 200),
    )
    return {
      title: '見つけた意味',
      body: content,
    }
  }
}

export interface Action {
  id: string
  text: string
}

export async function generateActions(
  action: string,
  meaningTitle: string,
  meaningBody: string,
): Promise<Action[]> {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    throw new Error('GLM_API_KEY is not set')
  }

  const baseUrl =
    process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4/'
  const model = process.env.GLM_MODEL || 'glm-4.7'

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: ACTIONS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `やったこと: ${action}\n見つけた意味: ${meaningTitle} — ${meaningBody}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    let errorBody: string | undefined
    try {
      errorBody = await response.text()
    } catch {
      // ignore
    }
    console.error('[GLM API] Actions request failed:', {
      status: response.status,
      body: errorBody,
    })
    throw new Error(
      `GLM API error: ${response.status} ${response.statusText}`,
    )
  }

  let rawText: string
  try {
    rawText = await response.text()
  } catch (e) {
    console.error('[GLM API] Failed to read actions response:', e)
    throw new Error('GLM API error: failed to read response body')
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error('[GLM API] Actions response not valid JSON:', rawText.slice(0, 500))
    throw new Error('GLM API error: invalid JSON response')
  }

  const choices = data.choices as
    | Array<{ message?: { content?: string; reasoning_content?: string } }>
    | undefined
  const message = choices?.[0]?.message
  const content = message?.content?.trim() || null

  if (!content) {
    const reasoning = message?.reasoning_content
    if (reasoning) {
      const jsonMatch = reasoning.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          // fall through
        }
      }
    }
    throw new Error('GLM API error: no content in actions response')
  }

  try {
    return JSON.parse(content)
  } catch {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim())
      } catch {
        // fall through
      }
    }
    throw new Error('GLM API error: failed to parse actions response')
  }
}

export interface DeepDiveQuestion {
  id: string
  text: string
}

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

export async function generateDeepDiveQuestions(
  action: string,
  meaningTitle: string,
  meaningBody: string,
  conversation: ConversationEntry[] = [],
): Promise<DeepDiveQuestion[]> {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    throw new Error('GLM_API_KEY is not set')
  }

  const baseUrl =
    process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4/'
  const model = process.env.GLM_MODEL || 'glm-4.7'

  const messages = [
    { role: 'system', content: DEEP_DIVE_QUESTIONS_PROMPT },
    ...conversation,
    {
      role: 'user',
      content: `やったこと: ${action}\n見つけた意味: ${meaningTitle} — ${meaningBody}\n\nこの意味をさらに深掘りする質問を3つ考えてください。`,
    },
  ]

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    let errorBody: string | undefined
    try {
      errorBody = await response.text()
    } catch {
      // ignore
    }
    console.error('[GLM API] Deep dive questions request failed:', {
      status: response.status,
      body: errorBody,
    })
    throw new Error(
      `GLM API error: ${response.status} ${response.statusText}`,
    )
  }

  let rawText: string
  try {
    rawText = await response.text()
  } catch (e) {
    console.error('[GLM API] Failed to read deep dive response:', e)
    throw new Error('GLM API error: failed to read response body')
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error('[GLM API] Deep dive response not valid JSON:', rawText.slice(0, 500))
    throw new Error('GLM API error: invalid JSON response')
  }

  const choices = data.choices as
    | Array<{ message?: { content?: string; reasoning_content?: string } }>
    | undefined
  const message = choices?.[0]?.message
  const content = message?.content?.trim() || null

  if (!content) {
    const reasoning = message?.reasoning_content
    if (reasoning) {
      const jsonMatch = reasoning.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          // fall through
        }
      }
    }
    throw new Error('GLM API error: no content in deep dive response')
  }

  try {
    return JSON.parse(content)
  } catch {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim())
      } catch {
        // fall through
      }
    }
    throw new Error('GLM API error: failed to parse deep dive response')
  }
}

export async function generateDeepDiveMeaning(
  action: string,
  conversation: ConversationEntry[],
): Promise<{ title: string; body: string }> {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) {
    throw new Error('GLM_API_KEY is not set')
  }

  const baseUrl =
    process.env.GLM_BASE_URL || 'https://api.z.ai/api/coding/paas/v4/'
  const model = process.env.GLM_MODEL || 'glm-4.7'

  const messages = [
    { role: 'system', content: DEEP_DIVE_MEANING_PROMPT },
    ...conversation,
    {
      role: 'user',
      content: `やったこと: ${action}\n\nこの会話の流れを踏まえて、新しい意味を見つけてください。`,
    },
  ]

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    let errorBody: string | undefined
    try {
      errorBody = await response.text()
    } catch {
      // ignore
    }
    console.error('[GLM API] Deep dive meaning request failed:', {
      status: response.status,
      body: errorBody,
    })
    throw new Error(
      `GLM API error: ${response.status} ${response.statusText}`,
    )
  }

  let rawText: string
  try {
    rawText = await response.text()
  } catch (e) {
    console.error('[GLM API] Failed to read deep dive meaning response:', e)
    throw new Error('GLM API error: failed to read response body')
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error('[GLM API] Deep dive meaning response not valid JSON:', rawText.slice(0, 500))
    throw new Error('GLM API error: invalid JSON response')
  }

  const choices = data.choices as
    | Array<{ message?: { content?: string; reasoning_content?: string } }>
    | undefined
  const message = choices?.[0]?.message
  const content = message?.content?.trim() || null

  if (!content) {
    const reasoning = message?.reasoning_content
    if (reasoning) {
      const jsonMatch = reasoning.match(
        /\{\s*"title"\s*:\s*"[^"]*"\s*,\s*"body"\s*:\s*"[^"]*"\s*\}/,
      )
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          // fall through
        }
      }
    }
    throw new Error('GLM API error: no content in deep dive meaning response')
  }

  try {
    return JSON.parse(content)
  } catch {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim())
      } catch {
        // fall through
      }
    }
    return {
      title: '新たな意味',
      body: content,
    }
  }
}
