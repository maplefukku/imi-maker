import { NextResponse } from 'next/server'
import { generateMeaning } from '@/lib/glm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action || typeof action !== 'string' || action.trim() === '') {
      return NextResponse.json(
        { error: 'action は必須です' },
        { status: 400 },
      )
    }

    if (action.length > 1000) {
      return NextResponse.json(
        { error: 'もう少し短くしてみて' },
        { status: 400 },
      )
    }

    const meaning = await generateMeaning(action.trim())

    return NextResponse.json({ meaning })
  } catch (error) {
    console.error('Meaning generation failed:', error)
    return NextResponse.json(
      { error: '意味の生成に失敗しました' },
      { status: 500 },
    )
  }
}
