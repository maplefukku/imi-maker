import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockPush = vi.fn()

vi.mock('framer-motion', () => ({
  motion: {
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">意味メーカー</header>,
}))

import InputPage from '@/app/input/page'

describe('入力ページ', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('質問見出しが表示される', () => {
    render(<InputPage />)
    expect(screen.getByText('今日、何した？')).toBeInTheDocument()
  })

  it('テキストエリアが表示される', () => {
    render(<InputPage />)
    expect(screen.getByLabelText('今日やったこと')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/バイトした/)).toBeInTheDocument()
  })

  it('送信ボタンが表示される', () => {
    render(<InputPage />)
    expect(screen.getByRole('button', { name: '意味を見つける' })).toBeInTheDocument()
  })

  it('空の入力では送信ボタンが無効', () => {
    render(<InputPage />)
    const button = screen.getByRole('button', { name: '意味を見つける' })
    expect(button).toBeDisabled()
  })

  it('テキスト入力後に送信ボタンが有効になる', async () => {
    const user = userEvent.setup()
    render(<InputPage />)

    const textarea = screen.getByLabelText('今日やったこと')
    await user.type(textarea, 'バイトした')

    const button = screen.getByRole('button', { name: '意味を見つける' })
    expect(button).not.toBeDisabled()
  })

  it('1000文字を超えると警告が表示される', () => {
    render(<InputPage />)

    const textarea = screen.getByLabelText('今日やったこと')
    fireEvent.change(textarea, { target: { value: 'あ'.repeat(1001) } })

    expect(screen.getByText('もう少し短くしてみて')).toBeInTheDocument()
  })

  it('補足テキストが表示される', () => {
    render(<InputPage />)
    expect(screen.getByText('大したことじゃなくて全然OK')).toBeInTheDocument()
  })

  it('ヘッダーが表示される', () => {
    render(<InputPage />)
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })
})
