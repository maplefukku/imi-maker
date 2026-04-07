import { describe, it, expect } from 'vitest'
import { generateTags, getMonthlySummary } from '@/lib/tags'

describe('generateTags', () => {
  it('成長に関するキーワードでタグが生成される', () => {
    expect(generateTags('人の感情を読む力が育っている')).toContain('成長')
  })

  it('人間関係に関するキーワードでタグが生成される', () => {
    expect(generateTags('仲間との絆が深まった')).toContain('人間関係')
  })

  it('複数のタグが同時に生成される', () => {
    const tags = generateTags('仲間と挑戦して成長できた')
    expect(tags).toContain('成長')
    expect(tags).toContain('人間関係')
    expect(tags).toContain('挑戦')
  })

  it('マッチしない場合は空配列を返す', () => {
    expect(generateTags('あいうえお')).toEqual([])
  })

  it('感謝タグが生成される', () => {
    expect(generateTags('周りに支えられて感謝している')).toContain('感謝')
  })

  it('学びタグが生成される', () => {
    expect(generateTags('新しい気づきを得た')).toContain('学び')
  })

  it('自信タグが生成される', () => {
    expect(generateTags('達成感を味わえた')).toContain('自信')
  })

  it('継続タグが生成される', () => {
    expect(generateTags('毎日の積み重ねが大事')).toContain('継続')
  })

  it('創造タグが生成される', () => {
    expect(generateTags('アイデアを生み出す力')).toContain('創造')
  })

  it('回復タグが生成される', () => {
    expect(generateTags('リフレッシュできた')).toContain('回復')
  })

  it('決断タグが生成される', () => {
    expect(generateTags('大きな決断ができた')).toContain('決断')
  })
})

describe('getMonthlySummary', () => {
  const now = new Date('2026-04-15T00:00:00Z')

  it('今月の件数を返す', () => {
    const meanings = [
      { meaning: '成長できた', created_at: '2026-04-01T10:00:00Z' },
      { meaning: '仲間と協力', created_at: '2026-04-10T10:00:00Z' },
      { meaning: '先月の分', created_at: '2026-03-15T10:00:00Z' },
    ]
    const summary = getMonthlySummary(meanings, now)
    expect(summary.count).toBe(2)
  })

  it('タグの出現回数が降順でソートされる', () => {
    const meanings = [
      { meaning: '成長できた', created_at: '2026-04-01T10:00:00Z' },
      { meaning: '仲間と成長', created_at: '2026-04-02T10:00:00Z' },
      { meaning: '挑戦した', created_at: '2026-04-03T10:00:00Z' },
    ]
    const summary = getMonthlySummary(meanings, now)
    expect(summary.tags[0].tag).toBe('成長')
    expect(summary.tags[0].count).toBe(2)
  })

  it('今月のデータがない場合は0件', () => {
    const meanings = [
      { meaning: '先月の分', created_at: '2026-03-15T10:00:00Z' },
    ]
    const summary = getMonthlySummary(meanings, now)
    expect(summary.count).toBe(0)
    expect(summary.tags).toEqual([])
  })

  it('空配列の場合は0件', () => {
    const summary = getMonthlySummary([], now)
    expect(summary.count).toBe(0)
    expect(summary.tags).toEqual([])
  })
})
