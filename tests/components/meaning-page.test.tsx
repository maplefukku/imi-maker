import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

let mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}))

import MeaningPage from '@/app/meaning/page'

describe('MeaningPage', () => {
  it('should show empty state when no action is provided', () => {
    mockSearchParams = new URLSearchParams()
    render(<MeaningPage />)
    expect(screen.getByText('表示する意味がありません')).toBeInTheDocument()
  })

  it('should display the action, title, and body', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: '人の感情を読む力',
      body: '接客って、相手が何を求めてるかを読むトレーニングかもね。',
    })
    render(<MeaningPage />)

    expect(screen.getByText('あなたがやったこと')).toBeInTheDocument()
    expect(screen.getByText('バイトした')).toBeInTheDocument()
    expect(screen.getByText('人の感情を読む力')).toBeInTheDocument()
    expect(screen.getByText(/接客って/)).toBeInTheDocument()
  })

  it('should show the "見つけた意味" label', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: 'テスト',
      body: 'テスト本文',
    })
    render(<MeaningPage />)
    expect(screen.getByText('見つけた意味')).toBeInTheDocument()
  })

  it('should show navigation buttons', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: 'テスト',
      body: 'テスト本文',
    })
    render(<MeaningPage />)
    expect(screen.getByRole('button', { name: 'もう1つ入力する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '最初に戻る' })).toBeInTheDocument()
  })

  it('should link "もう1つ入力する" to /input', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: 'テスト',
      body: 'テスト本文',
    })
    render(<MeaningPage />)
    const button = screen.getByRole('button', { name: 'もう1つ入力する' })
    const link = button.closest('a')
    expect(link).toHaveAttribute('href', '/input')
  })

  it('should link "最初に戻る" to /', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: 'テスト',
      body: 'テスト本文',
    })
    render(<MeaningPage />)
    const button = screen.getByRole('button', { name: '最初に戻る' })
    const link = button.closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('should show back button in header', () => {
    mockSearchParams = new URLSearchParams({
      action: 'バイトした',
      title: 'テスト',
      body: 'テスト本文',
    })
    render(<MeaningPage />)
    expect(screen.getByText('戻る')).toBeInTheDocument()
  })
})
