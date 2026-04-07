import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DailyHints } from '@/components/daily-hints'
import { HINT_SEEN_KEY } from '@/lib/daily-hints'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('lucide-react', () => ({
  Lightbulb: () => <span data-testid="lightbulb-icon" />,
  X: () => <span data-testid="x-icon" />,
}))

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

describe('DailyHints', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockStorage = createLocalStorageMock()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ヒントが表示される', async () => {
    render(<DailyHints onInsert={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByRole('region', { name: '今日のヒント' })).toBeInTheDocument()
    })
    expect(screen.getByText('今日のヒント')).toBeInTheDocument()
  })

  it('ドットインジケーターが3つ表示される', async () => {
    render(<DailyHints onInsert={vi.fn()} />)
    await waitFor(() => {
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('ドットをクリックするとヒントが切り替わる', async () => {
    const user = userEvent.setup()
    render(<DailyHints onInsert={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('region', { name: '今日のヒント' })).toBeInTheDocument()
    })

    const firstHintText = screen.getByRole('region', { name: '今日のヒント' }).querySelector('p')!.textContent

    const tabs = screen.getAllByRole('tab')
    await user.click(tabs[1])

    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')

    // ヒントの内容が変わっている（異なるヒントが表示される）
    const newHintText = screen.getByRole('region', { name: '今日のヒント' }).querySelector('p')!.textContent
    expect(newHintText).not.toBe(firstHintText)
  })

  it('ヒントをクリックすると例文が挿入される', async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    render(<DailyHints onInsert={onInsert} />)

    await waitFor(() => {
      expect(screen.getByRole('region', { name: '今日のヒント' })).toBeInTheDocument()
    })

    // ヒントのボタンをクリック（aria-labelにヒントの質問が含まれる）
    const hintButtons = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('aria-label')?.startsWith('ヒント:'),
    )
    await user.click(hintButtons[0])

    expect(onInsert).toHaveBeenCalledTimes(1)
    expect(typeof onInsert.mock.calls[0][0]).toBe('string')
    expect(onInsert.mock.calls[0][0].length).toBeGreaterThan(0)
  })

  it('ヒントをクリックするとLocalStorageに保存されて非表示になる', async () => {
    const user = userEvent.setup()
    render(<DailyHints onInsert={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('region', { name: '今日のヒント' })).toBeInTheDocument()
    })

    // ヒントのボタンをクリック（aria-labelにヒントの質問が含まれる）
    const hintButtons = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('aria-label')?.startsWith('ヒント:'),
    )
    await user.click(hintButtons[0])

    const today = new Date().toISOString().slice(0, 10)
    expect(mockStorage.setItem).toHaveBeenCalledWith(HINT_SEEN_KEY, today)
    expect(screen.queryByRole('region', { name: '今日のヒント' })).not.toBeInTheDocument()
  })

  it('閉じるボタンでヒントが非表示になる', async () => {
    const user = userEvent.setup()
    render(<DailyHints onInsert={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByLabelText('ヒントを閉じる')).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('ヒントを閉じる')
    await user.click(closeButton)

    const today = new Date().toISOString().slice(0, 10)
    expect(mockStorage.setItem).toHaveBeenCalledWith(HINT_SEEN_KEY, today)
    expect(screen.queryByRole('region', { name: '今日のヒント' })).not.toBeInTheDocument()
  })

  it('今日すでにスキップ済みなら表示されない', () => {
    const today = new Date().toISOString().slice(0, 10)
    mockStorage.setItem(HINT_SEEN_KEY, today)

    render(<DailyHints onInsert={vi.fn()} />)
    expect(screen.queryByRole('region', { name: '今日のヒント' })).not.toBeInTheDocument()
  })

  it('昨日のスキップ記録なら今日は表示される', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    mockStorage.setItem(HINT_SEEN_KEY, yesterday)

    render(<DailyHints onInsert={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByRole('region', { name: '今日のヒント' })).toBeInTheDocument()
    })
  })
})
