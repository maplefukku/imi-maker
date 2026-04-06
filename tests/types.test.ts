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
