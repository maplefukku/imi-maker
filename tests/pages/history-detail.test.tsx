import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: 'test-id-1' }),
}))

vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">意味メーカー</header>,
}))

vi.mock('@/components/share-buttons', () => ({
  ShareButtons: () => <div data-testid="share-buttons">シェアボタン</div>,
}))

import HistoryDetailPage from '@/app/history/[id]/page'

const mockMeaning = {
  id: 'test-id-1',
  action: 'バイトした',
  meaning: '人の感情を読む力が育っている',
  title: '共感力の成長',
  suggestions: ['日記を書いてみる', '友達に話してみる'],
  created_at: '2026-04-01T10:00:00Z',
}

describe('セッション詳細ページ', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('ローディング中にスケルトンが表示される', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
    render(<HistoryDetailPage />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('セッション詳細が表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('バイトした')).toBeInTheDocument()
    })

    expect(screen.getByText('共感力の成長')).toBeInTheDocument()
    expect(screen.getByText('人の感情を読む力が育っている')).toBeInTheDocument()
  })

  it('シェアボタンが表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByTestId('share-buttons')).toBeInTheDocument()
    })
  })

  it('「もう1つ入力する」ボタンがある', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('もう1つ入力する')).toBeInTheDocument()
    })

    const inputLink = screen.getByText('もう1つ入力する').closest('a')
    expect(inputLink).toHaveAttribute('href', '/input')
  })

  it('「履歴に戻る」ボタンがある', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('履歴に戻る')).toBeInTheDocument()
    })

    const historyLink = screen.getByText('履歴に戻る').closest('a')
    expect(historyLink).toHaveAttribute('href', '/history')
  })

  it('アクション提案が表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('アクション提案')).toBeInTheDocument()
    })

    expect(screen.getByText('日記を書いてみる')).toBeInTheDocument()
    expect(screen.getByText('友達に話してみる')).toBeInTheDocument()
  })

  it('日付が表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: mockMeaning }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('2026年4月1日')).toBeInTheDocument()
    })
  })

  it('suggestionsが空の場合はアクション提案セクションを表示しない', async () => {
    const meaningNoSuggestions = { ...mockMeaning, suggestions: [] }
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ meaning: meaningNoSuggestions }),
      })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('バイトした')).toBeInTheDocument()
    })

    expect(screen.queryByText('アクション提案')).not.toBeInTheDocument()
  })

  it('存在しないIDの場合エラーが表示される', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false })
    ) as unknown as typeof fetch

    render(<HistoryDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('この履歴は見つかりませんでした')).toBeInTheDocument()
    })
  })

  it('ヘッダーが表示される', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
    render(<HistoryDetailPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
