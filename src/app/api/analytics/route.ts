import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AnalyticsEventPayload {
  type: 'meaning_generated' | 'history_viewed' | 'session_viewed' | 'shared'
  data?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEventPayload = await request.json()

    if (!body.type) {
      return NextResponse.json(
        { error: 'イベントタイプが必要です' },
        { status: 400 },
      )
    }

    const validTypes = [
      'meaning_generated',
      'history_viewed',
      'session_viewed',
      'shared',
    ]
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: '無効なイベントタイプです' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('analytics_events').insert({
      event_type: body.type,
      event_data: body.data ?? {},
      user_id: user?.id ?? null,
    })

    if (error) {
      console.error('[Analytics API] Insert error:', error)
      return NextResponse.json(
        { error: 'イベントの記録に失敗しました' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'リクエストの処理に失敗しました' },
      { status: 400 },
    )
  }
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, created_at, event_data')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000

  const byType: Record<string, number> = {}
  let last24h = 0

  for (const event of data ?? []) {
    byType[event.event_type] = (byType[event.event_type] || 0) + 1
    if (new Date(event.created_at).getTime() > dayAgo) {
      last24h++
    }
  }

  return NextResponse.json({
    stats: {
      total: data?.length ?? 0,
      byType,
      last24h,
    },
    events: data,
  })
}
