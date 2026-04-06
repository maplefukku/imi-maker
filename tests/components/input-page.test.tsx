import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import InputPage from '@/app/input/page'

describe('InputPage', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockPush.mockReset()
  })

  it('should render the heading', () => {
    render(<InputPage />)
    expect(screen.getByText('今日、何した？')).toBeInTheDocument()
  })

  it('should render textarea with placeholder', () => {
    render(<InputPage />)
    expect(screen.getByPlaceholderText(/バイトした/)).toBeInTheDocument()
  })

  it('should render submit button disabled when textarea is empty', () => {
    render(<InputPage />)
    const button = screen.getByRole('button', { name: '意味を見つける' })
    expect(button).toBeDisabled()
  })

  it('should enable submit button when textarea has text', async () => {
    const user = userEvent.setup()
    render(<InputPage />)
    const textarea = screen.getByLabelText('今日やったこと')
    await user.type(textarea, 'バイトした')
    const button = screen.getByRole('button', { name: '意味を見つける' })
    expect(button).not.toBeDisabled()
  })

  it('should show error when text exceeds 1000 chars', async () => {
    const user = userEvent.setup()
    render(<InputPage />)
    const textarea = screen.getByLabelText('今日やったこと')
    const longText = 'あ'.repeat(1001)
    await user.click(textarea)
    // Use fireEvent for large input
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(textarea, { target: { value: longText } })
    expect(screen.getByText('もう少し短くしてみて')).toBeInTheDocument()
  })

  it('should show back button', () => {
    render(<InputPage />)
    expect(screen.getByText('戻る')).toBeInTheDocument()
  })

  it('should show encouraging text', () => {
    render(<InputPage />)
    expect(screen.getByText('大したことじゃなくて全然OK')).toBeInTheDocument()
  })

  it('should call API and navigate on submit', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meaning: { title: 'テスト', body: 'テスト本文' },
      }),
    })

    render(<InputPage />)
    const textarea = screen.getByLabelText('今日やったこと')
    await user.type(textarea, 'バイトした')
    const button = screen.getByRole('button', { name: '意味を見つける' })
    await user.click(button)

    expect(mockFetch).toHaveBeenCalledWith('/api/meaning', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => { resolvePromise = resolve }),
    )

    render(<InputPage />)
    const textarea = screen.getByLabelText('今日やったこと')
    await user.type(textarea, 'バイトした')
    const button = screen.getByRole('button', { name: '意味を見つける' })
    await user.click(button)

    expect(screen.getByRole('button', { name: '意味を見つけてる...' })).toBeDisabled()

    resolvePromise!({
      ok: true,
      json: async () => ({ meaning: { title: 'テスト', body: '本文' } }),
    })
  })

  it('should show error on API failure', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'エラーが発生しました' }),
    })

    render(<InputPage />)
    const textarea = screen.getByLabelText('今日やったこと')
    await user.type(textarea, 'バイトした')
    const button = screen.getByRole('button', { name: '意味を見つける' })
    await user.click(button)

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
  })
})
