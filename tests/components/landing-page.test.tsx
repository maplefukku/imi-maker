import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

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

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

import LandingPage from '@/app/page'

describe('LandingPage', () => {
  it('should render the hero heading', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    expect(screen.getByText(/今日やったこと、/)).toBeInTheDocument()
    expect(screen.getByText(/意味あるかも。/)).toBeInTheDocument()
  })

  it('should render the sub-text', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    expect(screen.getByText(/入力するだけ。/)).toBeInTheDocument()
    expect(screen.getByText(/AIが勝手に意味を見つけます/)).toBeInTheDocument()
  })

  it('should render the CTA button linking to /input', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    const button = screen.getByRole('button', { name: 'やってみる' })
    expect(button).toBeInTheDocument()
    const link = button.closest('a')
    expect(link).toHaveAttribute('href', '/input')
  })

  it('should render the header with app name', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    expect(screen.getByText('意味メーカー')).toBeInTheDocument()
  })

  it('should not show back button on landing page', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    expect(screen.queryByText('戻る')).not.toBeInTheDocument()
  })

  it('ログイン済みの場合「履歴を見る」ボタンが表示される', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    render(<LandingPage />)
    await waitFor(() => {
      expect(screen.getByText('履歴を見る')).toBeInTheDocument()
    })
    const link = screen.getByText('履歴を見る').closest('a')
    expect(link).toHaveAttribute('href', '/history')
  })

  it('未ログインの場合「履歴を見る」ボタンが表示されない', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    render(<LandingPage />)
    // Wait for useEffect to complete
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled()
    })
    expect(screen.queryByText('履歴を見る')).not.toBeInTheDocument()
  })
})
