import { NextResponse } from 'next/server'
import { generateActions } from '@/lib/glm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, meaningTitle, meaningBody } = body

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

    const actions = await generateActions(
      action.trim(),
      meaningTitle.trim(),
      meaningBody.trim(),
    )

    return NextResponse.json({ actions })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[API /actions] Generation failed:', {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    })
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: 'アクション提案の生成に失敗しました',
        ...(isDev && { detail: message }),
      },
      { status: 500 },
    )
  }
}
