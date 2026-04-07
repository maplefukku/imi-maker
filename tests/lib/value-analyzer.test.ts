import { describe, it, expect } from 'vitest'
import { analyzeValues } from '@/lib/value-analyzer'

describe('analyzeValues', () => {
  it('5件未満の場合は空の結果を返す', () => {
    const result = analyzeValues([
      { meaning: '成長できた' },
      { meaning: '仲間と協力' },
    ])
    expect(result.topValues).toEqual([])
    expect(result.totalMeanings).toBe(2)
    expect(result.insight).toBe('')
  })

  it('5件以上で価値観分析を返す', () => {
    const meanings = [
      { meaning: '成長できた経験' },
      { meaning: '仲間との絆が深まった' },
      { meaning: '新しい挑戦をして成長した' },
      { meaning: '毎日の積み重ねで成長' },
      { meaning: '感謝の気持ちを持てた' },
    ]
    const result = analyzeValues(meanings)

    expect(result.totalMeanings).toBe(5)
    expect(result.topValues.length).toBeGreaterThan(0)
    expect(result.topValues[0].value).toBe('成長')
    expect(result.topValues[0].score).toBe(3)
  })

  it('パーセンテージが計算される', () => {
    const meanings = [
      { meaning: '成長できた' },
      { meaning: '成長した' },
      { meaning: '成長を実感' },
      { meaning: '挑戦した' },
      { meaning: '挑戦して乗り越えた' },
    ]
    const result = analyzeValues(meanings)

    const total = result.topValues.reduce((sum, v) => sum + v.percentage, 0)
    expect(total).toBeGreaterThanOrEqual(95)
    expect(total).toBeLessThanOrEqual(105)
  })

  it('最大5つの価値観を返す', () => {
    const meanings = [
      { meaning: '成長できた' },
      { meaning: '仲間との絆' },
      { meaning: '新しい挑戦' },
      { meaning: '感謝している' },
      { meaning: '学びを得た' },
      { meaning: '自信がついた' },
      { meaning: '継続の力' },
      { meaning: '創造的なアイデア' },
      { meaning: 'リフレッシュできた' },
      { meaning: '決断した' },
    ]
    const result = analyzeValues(meanings)
    expect(result.topValues.length).toBeLessThanOrEqual(5)
  })

  it('insightが最上位の価値観に対応する', () => {
    const meanings = [
      { meaning: '挑戦して乗り越えた' },
      { meaning: '新しい挑戦をした' },
      { meaning: '初めてのチャレンジ' },
      { meaning: '挑戦の連続だった' },
      { meaning: '挑戦する勇気' },
    ]
    const result = analyzeValues(meanings)
    expect(result.insight).toContain('行動力')
  })

  it('タグが一つもマッチしない場合も正常に動作する', () => {
    const meanings = [
      { meaning: 'あいうえお' },
      { meaning: 'かきくけこ' },
      { meaning: 'さしすせそ' },
      { meaning: 'たちつてと' },
      { meaning: 'なにぬねの' },
    ]
    const result = analyzeValues(meanings)
    expect(result.topValues).toEqual([])
    expect(result.totalMeanings).toBe(5)
    expect(result.insight).toBe('')
  })

  it('降順でソートされる', () => {
    const meanings = [
      { meaning: '仲間と協力' },
      { meaning: '成長できた' },
      { meaning: '成長を実感' },
      { meaning: '成長した気がする' },
      { meaning: '仲間との信頼関係' },
    ]
    const result = analyzeValues(meanings)
    for (let i = 1; i < result.topValues.length; i++) {
      expect(result.topValues[i - 1].score).toBeGreaterThanOrEqual(result.topValues[i].score)
    }
  })
})
