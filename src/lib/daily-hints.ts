/** 体験想起プロンプト — 日替わりヒント */

export interface Hint {
  question: string
  example: string
}

/** ヒントプール。日替わりで3つ選ばれる */
export const HINT_POOL: Hint[] = [
  { question: '今日誰かと話した？', example: '友達とランチしながら将来の話をした' },
  { question: '何か新しいことを試した？', example: '初めてのカフェに行ってみた' },
  { question: '誰かに手を貸した？', example: '後輩の課題を一緒に考えた' },
  { question: 'ちょっとでも嬉しかったことは？', example: '帰り道に夕焼けがきれいだった' },
  { question: '今日がんばったことは？', example: 'レポートをなんとか提出した' },
  { question: '何か食べた？', example: 'コンビニで新作スイーツを買った' },
  { question: 'どこかに行った？', example: '図書館で2時間くらい勉強した' },
  { question: '誰かに感謝したいことは？', example: '友達が傘を貸してくれた' },
  { question: 'ふと考えたことは？', example: '電車で将来のことをぼんやり考えた' },
  { question: '小さな発見はあった？', example: '通学路に知らない花が咲いてた' },
  { question: '何かを決めた？', example: '週末にジムに行くことにした' },
  { question: 'いつもと違うことをした？', example: 'いつもと違う道で帰ってみた' },
]

const HINTS_PER_DAY = 3

/** 日付文字列 (YYYY-MM-DD) からシンプルなハッシュを返す */
function dayHash(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** 指定日のヒント3つを返す */
export function getHintsForDate(date: Date = new Date()): Hint[] {
  const dateStr = date.toISOString().slice(0, 10)
  const seed = dayHash(dateStr)

  // Fisher-Yates の先頭3つだけ (決定的シャッフル)
  const indices = HINT_POOL.map((_, i) => i)
  for (let i = 0; i < HINTS_PER_DAY; i++) {
    const j = i + ((seed + i * 7) % (indices.length - i))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices.slice(0, HINTS_PER_DAY).map((i) => HINT_POOL[i])
}

/** LocalStorage キー */
export const HINT_SEEN_KEY = 'imi-maker-hint-seen'

/** 今日すでにヒントをスキップ/非表示にしたか */
export function isHintSeenToday(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(HINT_SEEN_KEY)
    if (!saved) return false
    const today = new Date().toISOString().slice(0, 10)
    return saved === today
  } catch {
    return false
  }
}

/** ヒントを「今日見た」としてマークする */
export function markHintSeen(): void {
  if (typeof window === 'undefined') return
  try {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(HINT_SEEN_KEY, today)
  } catch { /* ignore */ }
}
