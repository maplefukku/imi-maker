import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
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

import LandingPage from '@/app/page'

describe('ランディングページ', () => {
  it('ヒーロー見出しが表示される', () => {
    render(<LandingPage />)
    expect(screen.getByText(/今日やったこと、/)).toBeInTheDocument()
    expect(screen.getByText(/意味あるかも。/)).toBeInTheDocument()
  })

  it('サブテキストが表示される', () => {
    render(<LandingPage />)
    expect(screen.getByText(/入力するだけ。/)).toBeInTheDocument()
    expect(screen.getByText(/AIが勝手に意味を見つけます/)).toBeInTheDocument()
  })

  it('CTAボタンが /input へのリンクになっている', () => {
    render(<LandingPage />)
    const button = screen.getByRole('button', { name: 'やってみる' })
    expect(button).toBeInTheDocument()
    const link = button.closest('a')
    expect(link).toHaveAttribute('href', '/input')
  })

  it('ヘッダーが表示される', () => {
    render(<LandingPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
