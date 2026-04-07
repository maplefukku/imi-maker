import { generateTags } from '@/lib/tags'

export interface ValueScore {
  value: string
  score: number
  percentage: number
}

export interface ValueAnalysis {
  topValues: ValueScore[]
  totalMeanings: number
  insight: string
}

const VALUE_INSIGHTS: Record<string, string> = {
  '成長': '自分を高めたいという向上心が原動力になっています',
  '人間関係': '人とのつながりを大切にする姿勢が根底にあります',
  '挑戦': '未知への一歩を恐れない行動力が特徴的です',
  '感謝': '周囲への感謝を忘れない謙虚さが強みです',
  '学び': '知的好奇心が行動の源になっています',
  '自信': '自己肯定感を育てることに価値を置いています',
  '継続': '地道な積み重ねを信じる粘り強さがあります',
  '創造': '新しいものを生み出すことに喜びを感じています',
  '回復': '自分を大切にするセルフケアの意識が高いです',
  '決断': '主体的に選び取る力を重視しています',
}

export function analyzeValues(meanings: { meaning: string }[]): ValueAnalysis {
  if (meanings.length < 5) {
    return { topValues: [], totalMeanings: meanings.length, insight: '' }
  }

  const tagCounts: Record<string, number> = {}
  for (const m of meanings) {
    const tags = generateTags(m.meaning)
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }

  const totalTags = Object.values(tagCounts).reduce((a, b) => a + b, 0)

  const topValues: ValueScore[] = Object.entries(tagCounts)
    .map(([value, score]) => ({
      value,
      score,
      percentage: totalTags > 0 ? Math.round((score / totalTags) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const topValue = topValues[0]?.value || ''
  const insight = VALUE_INSIGHTS[topValue] || ''

  return { topValues, totalMeanings: meanings.length, insight }
}
