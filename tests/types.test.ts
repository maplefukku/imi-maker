import { describe, it, expect } from 'vitest'
import type { Meaning, Profile, MeaningRequest, MeaningResponse, MeaningRecord, AppScreen } from '@/types'

describe('型定義', () => {
  it('Meaning型が正しいフィールドを持つ', () => {
    const meaning: Meaning = {
      id: '123',
      action: 'コードを書いた',
      meaning: '創造的な問題解決能力を発揮した',
      title: '今日の意味',
      suggestions: ['明日も続けよう', '新しい技術に挑戦'],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(meaning.id).toBe('123')
    expect(meaning.action).toBe('コードを書いた')
    expect(meaning.suggestions).toHaveLength(2)
  })

  it('Meaning型のtitleはオプショナル', () => {
    const meaning: Meaning = {
      id: '456',
      action: '散歩した',
      meaning: '心身のリフレッシュ',
      suggestions: [],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(meaning.title).toBeUndefined()
  })

  it('Profile型が正しいフィールドを持つ', () => {
    const profile: Profile = {
      id: 'user-uuid',
      email: 'test@example.com',
      created_at: '2026-04-07T00:00:00Z',
      updated_at: '2026-04-07T00:00:00Z',
    }
    expect(profile.id).toBe('user-uuid')
    expect(profile.email).toBe('test@example.com')
  })

  it('MeaningRequest型が正しいフィールドを持つ', () => {
    const req: MeaningRequest = { action: 'テスト' }
    expect(req.action).toBe('テスト')
  })

  it('MeaningResponse型が正しいフィールドを持つ', () => {
    const res: MeaningResponse = { title: 'タイトル', body: '本文' }
    expect(res.title).toBe('タイトル')
    expect(res.body).toBe('本文')
  })

  it('MeaningRecord型が正しいフィールドを持つ', () => {
    const record: MeaningRecord = {
      id: '789',
      user_id: 'user-123',
      action: '読書した',
      meaning: '知識の獲得',
      suggestions: ['続けよう'],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(record.user_id).toBe('user-123')
  })

  it('AppScreen型が正しい値を持つ', () => {
    const screens: AppScreen[] = ['landing', 'input', 'result']
    expect(screens).toContain('landing')
    expect(screens).toContain('input')
    expect(screens).toContain('result')
  })
})

describe('型の整合性', () => {
  it('MeaningRecordからMeaningへ変換できる', () => {
    const record: MeaningRecord = {
      id: 'rec-1',
      user_id: 'user-1',
      action: '勉強した',
      meaning: '成長への投資',
      suggestions: ['復習する', '応用する'],
      created_at: '2026-04-07T12:00:00Z',
    }
    const meaning: Meaning = {
      id: record.id,
      action: record.action,
      meaning: record.meaning,
      suggestions: record.suggestions,
      created_at: record.created_at,
    }
    expect(meaning.id).toBe(record.id)
    expect(meaning.action).toBe(record.action)
    expect(meaning.meaning).toBe(record.meaning)
    expect(meaning.suggestions).toEqual(record.suggestions)
    expect(meaning.created_at).toBe(record.created_at)
    expect(meaning.title).toBeUndefined()
  })

  it('MeaningRecordからMeaningへtitle付きで変換できる', () => {
    const record: MeaningRecord = {
      id: 'rec-2',
      user_id: 'user-2',
      action: '料理した',
      meaning: '創造性の発揮',
      suggestions: [],
      created_at: '2026-04-07T12:00:00Z',
    }
    const meaning: Meaning = {
      id: record.id,
      action: record.action,
      meaning: record.meaning,
      title: '今日のハイライト',
      suggestions: record.suggestions,
      created_at: record.created_at,
    }
    expect(meaning.title).toBe('今日のハイライト')
  })

  it('MeaningResponseのフィールドはMeaningのサブセット', () => {
    const response: MeaningResponse = {
      title: '意味の発見',
      body: '詳しい説明文',
    }
    const meaning: Meaning = {
      id: 'test-id',
      action: 'テスト',
      meaning: response.body,
      title: response.title,
      suggestions: [],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(meaning.title).toBe(response.title)
    expect(meaning.meaning).toBe(response.body)
  })

  it('MeaningRequestのactionはMeaningのactionと同じ型', () => {
    const request: MeaningRequest = { action: '走った' }
    const meaning: Meaning = {
      id: 'id-1',
      action: request.action,
      meaning: '健康維持',
      suggestions: [],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(meaning.action).toBe(request.action)
  })

  it('Meaningのsuggestionsは空配列を許容する', () => {
    const meaning: Meaning = {
      id: 'empty-sug',
      action: '休んだ',
      meaning: '回復',
      suggestions: [],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(meaning.suggestions).toEqual([])
    expect(meaning.suggestions).toBeInstanceOf(Array)
  })

  it('MeaningRecordのsuggestionsは文字列配列', () => {
    const record: MeaningRecord = {
      id: 'arr-test',
      user_id: 'user-x',
      action: '掃除した',
      meaning: '環境整備',
      suggestions: ['継続する', '範囲を広げる', '習慣化する'],
      created_at: '2026-04-07T00:00:00Z',
    }
    expect(record.suggestions).toHaveLength(3)
    record.suggestions.forEach((s) => {
      expect(typeof s).toBe('string')
    })
  })

  it('Profileの必須フィールドがすべて存在する', () => {
    const profile: Profile = {
      id: 'p-1',
      email: 'user@example.com',
      created_at: '2026-04-07T00:00:00Z',
      updated_at: '2026-04-07T01:00:00Z',
    }
    const keys = Object.keys(profile)
    expect(keys).toContain('id')
    expect(keys).toContain('email')
    expect(keys).toContain('created_at')
    expect(keys).toContain('updated_at')
    expect(keys).toHaveLength(4)
  })

  it('MeaningRecordの必須フィールドがすべて存在する', () => {
    const record: MeaningRecord = {
      id: 'mr-1',
      user_id: 'u-1',
      action: 'act',
      meaning: 'mean',
      suggestions: [],
      created_at: '2026-04-07T00:00:00Z',
    }
    const keys = Object.keys(record)
    expect(keys).toContain('id')
    expect(keys).toContain('user_id')
    expect(keys).toContain('action')
    expect(keys).toContain('meaning')
    expect(keys).toContain('suggestions')
    expect(keys).toContain('created_at')
    expect(keys).toHaveLength(6)
  })

  it('AppScreenは3つの値のみ許容する', () => {
    const allScreens: AppScreen[] = ['landing', 'input', 'result']
    expect(allScreens).toHaveLength(3)
    const unique = new Set(allScreens)
    expect(unique.size).toBe(3)
  })
})
