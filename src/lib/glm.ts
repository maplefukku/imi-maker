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
