import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

import { SessionList } from '@/components/session-list'

const mockMeanings = [
  {
    id: '1',
    action: 'バイトした',
    meaning: '人の感情を読む力が育っている',
    title: '共感力の成長',
    suggestions: [],
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: '2',
    action: '勉強した',
    meaning: '知識を深める力が身についている',
    suggestions: [],
    created_at: '2026-03-28T15:30:00Z',
  },
]

describe('SessionList', () => {
  it('ローディング中にスケルトンが表示される', () => {
    render(<SessionList meanings={[]} loading={true} error={null} />)
    expect(screen.getByTestId('session-list-loading')).toBeInTheDocument()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('セッション一覧が表示される', () => {
    render(<SessionList meanings={mockMeanings} loading={false} error={null} />)
    expect(screen.getByText('バイトした')).toBeInTheDocument()
    expect(screen.getByText('共感力の成長')).toBeInTheDocument()
  })

  it('各カードに詳細リンクがある', () => {
    render(<SessionList meanings={mockMeanings} loading={false} error={null} />)
    const links = screen.getAllByText('詳細を見る')
    expect(links).toHaveLength(2)
    const firstLink = screen.getByText('バイトした').closest('a')
    expect(firstLink).toHaveAttribute('href', '/history/1')
  })

  it('空の場合メッセージが表示される', () => {
    render(<SessionList meanings={[]} loading={false} error={null} />)
    expect(screen.getByText('まだ履歴がありません')).toBeInTheDocument()
  })

  it('エラー時にメッセージが表示される', () => {
    render(<SessionList meanings={[]} loading={false} error="読み込み失敗" />)
    expect(screen.getByText('読み込み失敗')).toBeInTheDocument()
  })

  it('titleがない場合meaningが表示される', () => {
    render(<SessionList meanings={mockMeanings} loading={false} error={null} />)
    expect(screen.getByText('知識を深める力が身についている')).toBeInTheDocument()
  })
})
