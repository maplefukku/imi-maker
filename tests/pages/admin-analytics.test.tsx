import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
}))

vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">意味メーカー</header>,
}))

const mockGetEventStats = vi.fn()
const mockClearEvents = vi.fn()

vi.mock('@/lib/analytics', () => ({
  getEventStats: (...args: unknown[]) => mockGetEventStats(...args),
  clearEvents: (...args: unknown[]) => mockClearEvents(...args),
}))

import AnalyticsPage from '@/app/admin/analytics/page'

describe('アナリティクス管理画面', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetEventStats.mockReturnValue({
      total: 15,
      byType: {
        meaning_generated: 8,
        history_viewed: 4,
        session_viewed: 2,
        shared: 1,
      },
      last24h: 5,
    })
  })

  it('統計が表示される', async () => {
    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument()
    })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('合計イベント')).toBeInTheDocument()
    expect(screen.getByText('直近24時間')).toBeInTheDocument()
  })

  it('イベント別の内訳が表示される', async () => {
    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('意味を生成')).toBeInTheDocument()
    })
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('履歴を閲覧')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('セッション詳細を閲覧')).toBeInTheDocument()
    expect(screen.getByText('シェア')).toBeInTheDocument()
  })

  it('タイトルが表示される', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('アナリティクス')).toBeInTheDocument()
  })

  it('ヘッダーが表示される', () => {
    render(<AnalyticsPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('リセットボタンでイベントがクリアされる', async () => {
    mockClearEvents.mockImplementation(() => {})
    mockGetEventStats
      .mockReturnValueOnce({
        total: 15,
        byType: { meaning_generated: 8, history_viewed: 4, session_viewed: 2, shared: 1 },
        last24h: 5,
      })
      .mockReturnValueOnce({
        total: 0,
        byType: {},
        last24h: 0,
      })

    render(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('リセット'))

    expect(mockClearEvents).toHaveBeenCalled()
    await waitFor(() => {
      // total と last24h の両方が0になる
      const totals = screen.getAllByText('0', { selector: '.text-3xl' })
      expect(totals).toHaveLength(2)
    })
  })

  it('イベントがゼロの場合も正しく表示される', () => {
    mockGetEventStats.mockReturnValue({
      total: 0,
      byType: {},
      last24h: 0,
    })

    render(<AnalyticsPage />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)
  })
})
