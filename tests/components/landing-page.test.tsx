import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

import LandingPage from '@/app/page'

describe('LandingPage', () => {
  it('should render the hero heading', () => {
    render(<LandingPage />)
    expect(screen.getByText(/今日やったこと、/)).toBeInTheDocument()
    expect(screen.getByText(/意味あるかも。/)).toBeInTheDocument()
  })

  it('should render the sub-text', () => {
    render(<LandingPage />)
    expect(screen.getByText(/入力するだけ。/)).toBeInTheDocument()
    expect(screen.getByText(/AIが勝手に意味を見つけます/)).toBeInTheDocument()
  })

  it('should render the CTA button linking to /input', () => {
    render(<LandingPage />)
    const button = screen.getByRole('button', { name: 'やってみる' })
    expect(button).toBeInTheDocument()
    const link = button.closest('a')
    expect(link).toHaveAttribute('href', '/input')
  })

  it('should render the header with app name', () => {
    render(<LandingPage />)
    expect(screen.getByText('意味メーカー')).toBeInTheDocument()
  })

  it('should not show back button on landing page', () => {
    render(<LandingPage />)
    expect(screen.queryByText('戻る')).not.toBeInTheDocument()
  })
})
