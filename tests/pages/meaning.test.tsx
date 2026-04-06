import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockSearchParams = new URLSearchParams()

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
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">意味メーカー</header>,
}))

import MeaningPage from '@/app/meaning/page'

describe('意味表示ページ', () => {
  it('パラメータなしの場合、入力へのリンクが表示される', () => {
    mockSearchParams.delete('action')
    mockSearchParams.delete('title')
    mockSearchParams.delete('body')

    render(<MeaningPage />)
    expect(screen.getByText('表示する意味がありません')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '入力する' })).toBeInTheDocument()
  })

  it('結果が表示される', () => {
    mockSearchParams.set('action', 'バイトした')
    mockSearchParams.set('title', '人の感情を読む力')
    mockSearchParams.set('body', '接客を通じて相手の気持ちを察する力が育ってるのかも。')

    render(<MeaningPage />)

    expect(screen.getByText('バイトした')).toBeInTheDocument()
    expect(screen.getByText('見つけた意味')).toBeInTheDocument()
    expect(screen.getByText('人の感情を読む力')).toBeInTheDocument()
    expect(screen.getByText(/接客を通じて/)).toBeInTheDocument()
  })

  it('「もう1つ入力する」ボタンが /input へのリンク', () => {
    mockSearchParams.set('action', 'バイトした')
    mockSearchParams.set('title', 'テスト')
    mockSearchParams.set('body', 'テスト本文')

    render(<MeaningPage />)
    const link = screen.getByRole('button', { name: 'もう1つ入力する' }).closest('a')
    expect(link).toHaveAttribute('href', '/input')
  })

  it('「最初に戻る」ボタンが / へのリンク', () => {
    mockSearchParams.set('action', 'バイトした')
    mockSearchParams.set('title', 'テスト')
    mockSearchParams.set('body', 'テスト本文')

    render(<MeaningPage />)
    const link = screen.getByRole('button', { name: '最初に戻る' }).closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('ヘッダーが表示される', () => {
    render(<MeaningPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
