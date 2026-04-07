// src/lib/analytics.ts
// LocalStorageベースの簡易アナリティクス

export interface AnalyticsEvent {
  type: 'meaning_generated' | 'history_viewed' | 'session_viewed' | 'shared'
  timestamp: string
  data?: Record<string, unknown>
}

const STORAGE_KEY = 'imi-maker-analytics'

export function trackEvent(
  type: AnalyticsEvent['type'],
  data?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return

  try {
    const events = getEvents()
    const event: AnalyticsEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    }
    events.push(event)

    // 最新1000件のみ保持
    const trimmed = events.slice(-1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('[Analytics] Failed to track event:', e)
  }
}

export function getEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getEventStats(): {
  total: number
  byType: Record<string, number>
  last24h: number
} {
  const events = getEvents()
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000

  const byType: Record<string, number> = {}
  let last24h = 0

  events.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + 1
    if (new Date(e.timestamp).getTime() > dayAgo) {
      last24h++
    }
  })

  return {
    total: events.length,
    byType,
    last24h,
  }
}

export function clearEvents(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
