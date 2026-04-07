import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <section {...props}>{children}</section>,
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">意味メーカー</header>,
}))

import HistoryPage from '@/app/history/page'

const mockMeanings = [
  {
    id: '1',
    action: 'バイトした',
    meaning: '人の感情を読む力が育っている',
    title: '共感力の成長',
    suggestions: ['接客で鍛えられた'],
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: '2',
    action: 'とても長いアクションのテストで四十文字を超えるかどうかを確認するためのテキストです。もっと長くする。',
    meaning: '継続する力',
    suggestions: [],
    created_at: '2026-03-28T15:30:00Z',
  },
]

describe('履歴ページ', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('ローディング中にスケルトンが表示される', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
    render(<HistoryPage />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('履歴が一覧表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: mockMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('バイトした')).toBeInTheDocument()
    })

    expect(screen.getByText('共感力の成長')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
  })

  it('長いアクションが省略表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: mockMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText(/とても長いアクション/)).toBeInTheDocument()
    })

    const truncated = screen.getByText(/とても長いアクション/)
    expect(truncated.textContent!.endsWith('...')).toBe(true)
  })

  it('titleがない場合meaningが表示される', async () => {
    const meaningsNoTitle = [
      {
        id: '3',
        action: '勉強した',
        meaning: '知識を深める力',
        suggestions: [],
        created_at: '2026-04-02T10:00:00Z',
      },
    ]
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: meaningsNoTitle }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('知識を深める力')).toBeInTheDocument()
    })
  })

  it('履歴が空の場合メッセージが表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: [] }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('まだ履歴がありません')).toBeInTheDocument()
    })
  })

  it('エラー時にメッセージが表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('履歴の読み込みに失敗しました')).toBeInTheDocument()
    })
  })

  it('ヘッダーが表示される', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
    render(<HistoryPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('各カードに詳細リンクがある', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: mockMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getAllByText('詳細を見る')).toHaveLength(2)
    })
  })

  it('タイムライン形式で表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: mockMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByTestId('timeline')).toBeInTheDocument()
    })
  })

  it('タグが表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: mockMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('#成長')).toBeInTheDocument()
    })
  })

  it('月間サマリーが表示される', async () => {
    const now = new Date()
    const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
    const thisMonthMeanings = [
      {
        id: '10',
        action: '成長を感じた',
        meaning: '人の感情を読む力が育っている',
        title: '共感力の成長',
        suggestions: [],
        created_at: thisMonthDate,
      },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: thisMonthMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByTestId('monthly-summary')).toBeInTheDocument()
    })

    expect(screen.getByText('今月の意味')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('月間サマリーに傾向タグが表示される', async () => {
    const now = new Date()
    const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
    const thisMonthMeanings = [
      {
        id: '10',
        action: '成長を感じた',
        meaning: '仲間と挑戦して成長できた',
        suggestions: [],
        created_at: thisMonthDate,
      },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: thisMonthMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByTestId('monthly-tags')).toBeInTheDocument()
    })

    expect(screen.getByText('今月の傾向')).toBeInTheDocument()
  })

  it('今月データがない場合は月間サマリーが非表示', async () => {
    const oldMeanings = [
      {
        id: '99',
        action: '昔の体験',
        meaning: '遠い過去の記録',
        suggestions: [],
        created_at: '2020-01-15T10:00:00Z',
      },
    ]

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meanings: oldMeanings }),
      })
    ) as unknown as typeof fetch

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('昔の体験')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('monthly-summary')).not.toBeInTheDocument()
  })
})
