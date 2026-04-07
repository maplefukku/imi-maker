import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackEvent, getEvents, getEventStats, clearEvents } from '@/lib/analytics'

describe('analytics', () => {
  let storage: Record<string, string>

  beforeEach(() => {
    storage = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
    })
  })

  describe('trackEvent', () => {
    it('イベントをlocalStorageに保存する', () => {
      trackEvent('meaning_generated')
      const events = JSON.parse(storage['imi-maker-analytics'])
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('meaning_generated')
      expect(events[0].timestamp).toBeDefined()
    })

    it('データ付きイベントを保存する', () => {
      trackEvent('shared', { platform: 'twitter' })
      const events = JSON.parse(storage['imi-maker-analytics'])
      expect(events[0].data).toEqual({ platform: 'twitter' })
    })

    it('複数イベントを蓄積する', () => {
      trackEvent('meaning_generated')
      trackEvent('history_viewed')
      trackEvent('shared')
      const events = JSON.parse(storage['imi-maker-analytics'])
      expect(events).toHaveLength(3)
    })

    it('1000件を超えるとトリミングされる', () => {
      // 999件のイベントを事前にセット
      const existing = Array.from({ length: 999 }, (_, i) => ({
        type: 'meaning_generated',
        timestamp: new Date(2026, 0, 1, 0, 0, i).toISOString(),
      }))
      storage['imi-maker-analytics'] = JSON.stringify(existing)

      trackEvent('history_viewed')
      trackEvent('shared')

      const events = JSON.parse(storage['imi-maker-analytics'])
      expect(events).toHaveLength(1000)
      // 最初の1件が切り捨てられている
      expect(events[events.length - 1].type).toBe('shared')
    })

    it('localStorage書き込みエラー時にconsole.errorが呼ばれる', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubGlobal('localStorage', {
        getItem: () => '[]',
        setItem: () => { throw new Error('quota exceeded') },
        removeItem: vi.fn(),
      })

      trackEvent('meaning_generated')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Failed to track event:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('getEvents', () => {
    it('イベントがない場合は空配列を返す', () => {
      expect(getEvents()).toEqual([])
    })

    it('保存されたイベントを返す', () => {
      const events = [
        { type: 'meaning_generated', timestamp: '2026-04-07T00:00:00Z' },
      ]
      storage['imi-maker-analytics'] = JSON.stringify(events)
      expect(getEvents()).toEqual(events)
    })

    it('不正なJSONの場合は空配列を返す', () => {
      storage['imi-maker-analytics'] = 'invalid-json'
      expect(getEvents()).toEqual([])
    })
  })

  describe('getEventStats', () => {
    it('イベントがない場合のデフォルト値', () => {
      const stats = getEventStats()
      expect(stats.total).toBe(0)
      expect(stats.byType).toEqual({})
      expect(stats.last24h).toBe(0)
    })

    it('タイプ別の集計が正しい', () => {
      const events = [
        { type: 'meaning_generated', timestamp: new Date().toISOString() },
        { type: 'meaning_generated', timestamp: new Date().toISOString() },
        { type: 'shared', timestamp: new Date().toISOString() },
        { type: 'history_viewed', timestamp: new Date().toISOString() },
      ]
      storage['imi-maker-analytics'] = JSON.stringify(events)

      const stats = getEventStats()
      expect(stats.total).toBe(4)
      expect(stats.byType.meaning_generated).toBe(2)
      expect(stats.byType.shared).toBe(1)
      expect(stats.byType.history_viewed).toBe(1)
    })

    it('24時間以内のイベント数が正しい', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000)
      const events = [
        { type: 'meaning_generated', timestamp: yesterday.toISOString() },
        { type: 'shared', timestamp: now.toISOString() },
        { type: 'history_viewed', timestamp: now.toISOString() },
      ]
      storage['imi-maker-analytics'] = JSON.stringify(events)

      const stats = getEventStats()
      expect(stats.total).toBe(3)
      expect(stats.last24h).toBe(2)
    })
  })

  describe('clearEvents', () => {
    it('localStorageからイベントを削除する', () => {
      storage['imi-maker-analytics'] = '[{"type":"test","timestamp":"2026-04-07T00:00:00Z"}]'
      clearEvents()
      expect(localStorage.removeItem).toHaveBeenCalledWith('imi-maker-analytics')
    })
  })
})
