const TAG_KEYWORDS: Record<string, string[]> = {
  '成長': ['成長', '育っ', '育て', '育む', '伸び', '上達', '進歩', 'レベルアップ', '力がつ', '鍛え'],
  '人間関係': ['人間関係', '友達', '仲間', '信頼', '絆', '支え', 'つながり', '協力', '共感', 'チーム'],
  '挑戦': ['挑戦', 'チャレンジ', '乗り越え', '克服', '踏み出', '新しい', '初めて', '勇気'],
  '感謝': ['感謝', 'ありがと', '恵まれ', '支えられ', '助け'],
  '学び': ['学び', '学ん', '知識', '理解', '気づ', '発見', '視野', '教訓'],
  '自信': ['自信', '誇り', '自分を信', '手応え', '達成感', 'やれる', 'できる'],
  '継続': ['継続', '続け', '習慣', 'コツコツ', '積み重ね', '毎日', '日々'],
  '創造': ['創造', 'クリエイティブ', '生み出', '表現', 'アイデア', '作品', 'ものづくり'],
  '回復': ['回復', '癒', '休む', 'リフレッシュ', '充電', 'ケア', '安らぎ'],
  '決断': ['決断', '選択', '決め', '覚悟', '判断', '意思'],
}

export function generateTags(text: string): string[] {
  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags
}

export function getMonthlySummary(
  meanings: { meaning: string; created_at: string }[],
  now: Date = new Date(),
): { count: number; tags: { tag: string; count: number }[] } {
  const year = now.getFullYear()
  const month = now.getMonth()

  const thisMonth = meanings.filter((m) => {
    const d = new Date(m.created_at)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const tagCounts: Record<string, number> = {}
  for (const m of thisMonth) {
    const tags = generateTags(m.meaning)
    for (const t of tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }

  const sorted = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  return { count: thisMonth.length, tags: sorted }
}
