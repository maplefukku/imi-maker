import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getHintsForDate,
  isHintSeenToday,
  markHintSeen,
  HINT_POOL,
  HINT_SEEN_KEY,
} from '@/lib/daily-hints'

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

describe('daily-hints', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockStorage = createLocalStorageMock()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getHintsForDate', () => {
    it('3つのヒントを返す', () => {
      const hints = getHintsForDate(new Date('2026-04-07'))
      expect(hints).toHaveLength(3)
    })

    it('ヒントはプールに含まれるものだけ', () => {
      const hints = getHintsForDate(new Date('2026-04-07'))
      for (const hint of hints) {
        expect(HINT_POOL).toContainEqual(hint)
      }
    })

    it('同じ日は同じヒントを返す', () => {
      const a = getHintsForDate(new Date('2026-04-07'))
      const b = getHintsForDate(new Date('2026-04-07'))
      expect(a).toEqual(b)
    })

    it('違う日は違うヒントを返す', () => {
      const a = getHintsForDate(new Date('2026-04-07'))
      const b = getHintsForDate(new Date('2026-04-08'))
      // 全く同じになる確率は非常に低い
      const aQuestions = a.map((h) => h.question)
      const bQuestions = b.map((h) => h.question)
      expect(aQuestions).not.toEqual(bQuestions)
    })

    it('3つのヒントは重複しない', () => {
      const hints = getHintsForDate(new Date('2026-04-07'))
      const questions = hints.map((h) => h.question)
      expect(new Set(questions).size).toBe(3)
    })
  })

  describe('isHintSeenToday', () => {
    it('何も保存されていなければfalse', () => {
      expect(isHintSeenToday()).toBe(false)
    })

    it('今日の日付が保存されていればtrue', () => {
      const today = new Date().toISOString().slice(0, 10)
      mockStorage.setItem(HINT_SEEN_KEY, today)
      expect(isHintSeenToday()).toBe(true)
    })

    it('昨日の日付が保存されていればfalse', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      mockStorage.setItem(HINT_SEEN_KEY, yesterday)
      expect(isHintSeenToday()).toBe(false)
    })
  })

  describe('markHintSeen', () => {
    it('今日の日付をLocalStorageに保存する', () => {
      markHintSeen()
      const today = new Date().toISOString().slice(0, 10)
      expect(mockStorage.setItem).toHaveBeenCalledWith(HINT_SEEN_KEY, today)
    })
  })
})
