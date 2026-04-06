const SYSTEM_PROMPT = `あなたは「意味メーカー」のAIです。ユーザーが今日やったことを入力します。
あなたの仕事は、その行動が将来どう役立つ可能性があるかを、肯定的に・押し付けがましくなく解釈することです。

ルール:
- 見出し（10文字以内）と本文（80-120文字）で返す
- 説教しない。「すごい」「えらい」も言わない
- 「かもね」「〜してるのかも」のような柔らかい語尾
- 具体的なスキルや力に紐づける
- 楽しげに、軽く
- JSON形式で返す: {"title": "...", "body": "..."}`

export async function generateMeaning(
  action: string,
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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `今日やったこと: ${action}` },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`GLM API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    return JSON.parse(content)
  } catch {
    return {
      title: '見つけた意味',
      body: content || '意味を見つけることができませんでした。',
    }
  }
}
