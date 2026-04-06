import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockBack = vi.fn()
const mockSetTheme = vi.fn()
let mockResolvedTheme = 'light'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: mockBack }),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme, setTheme: mockSetTheme }),
}))

import { Header } from '@/components/header'

describe('Header', () => {
  beforeEach(() => {
    mockResolvedTheme = 'light'
    mockSetTheme.mockClear()
  })

  it('アプリ名が表示される', () => {
    render(<Header />)
    expect(screen.getByText('意味メーカー')).toBeInTheDocument()
  })

  it('showBack=false のとき戻るボタンが表示されない', () => {
    render(<Header />)
    expect(screen.queryByText('戻る')).not.toBeInTheDocument()
  })

  it('showBack=true のとき戻るボタンが表示される', () => {
    render(<Header showBack />)
    expect(screen.getByText('戻る')).toBeInTheDocument()
  })

  it('戻るボタンをクリックすると router.back() が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<Header showBack />)
    await user.click(screen.getByText('戻る'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('テーマ切替ボタンが表示される', () => {
    render(<Header />)
    expect(screen.getByLabelText('テーマ切替')).toBeInTheDocument()
  })

  it('テーマ切替ボタンをクリックすると setTheme("dark") が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByLabelText('テーマ切替'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('ダークモード時にテーマ切替ボタンをクリックすると setTheme("light") が呼ばれる', async () => {
    mockResolvedTheme = 'dark'
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByLabelText('テーマ切替'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })
})
