import { NextResponse } from 'next/server'
import { generateDeepDiveQuestions, generateDeepDiveMeaning } from '@/lib/glm'

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, meaningTitle, meaningBody, conversation, mode } = body as {
      action?: string
      meaningTitle?: string
      meaningBody?: string
      conversation?: ConversationEntry[]
      mode?: 'questions' | 'meaning'
    }

    if (!action || typeof action !== 'string' || action.trim() === '') {
      return NextResponse.json(
        { error: 'action は必須です' },
        { status: 400 },
      )
    }

    if (!meaningTitle || !meaningBody) {
      return NextResponse.json(
        { error: '意味のタイトルと本文は必須です' },
        { status: 400 },
      )
    }

    if (mode === 'meaning') {
      const meaning = await generateDeepDiveMeaning(
        action.trim(),
        conversation || [],
      )
      return NextResponse.json({ meaning })
    }

    // default: questions mode
    const questions = await generateDeepDiveQuestions(
      action.trim(),
      meaningTitle.trim(),
      meaningBody.trim(),
      conversation || [],
    )
    return NextResponse.json({ questions })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[API /deep-dive] Generation failed:', {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    })
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: '深掘りの生成に失敗しました',
        ...(isDev && { detail: message }),
      },
      { status: 500 },
    )
  }
}
