import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

const mockToast = vi.fn()
vi.mock('sonner', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}))

import InputPage, { DRAFT_KEY } from '@/app/input/page'

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

describe('入力ページ', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    mockPush.mockClear()
    mockToast.mockClear()
    mockStorage = createLocalStorageMock()
    vi.stubGlobal('localStorage', mockStorage)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
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
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
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

  describe('意味の種類チップ', () => {
    it('チップ選択UIが表示される', () => {
      render(<InputPage />)
      expect(screen.getByRole('radiogroup', { name: '意味の種類' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'なんでもOK' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: '励まして' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: '気づかせて' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: '行動指針をちょうだい' })).toBeInTheDocument()
    })

    it('デフォルトで「なんでもOK」が選択されている', () => {
      render(<InputPage />)
      const defaultChip = screen.getByRole('radio', { name: 'なんでもOK' })
      expect(defaultChip).toHaveAttribute('aria-checked', 'true')
    })

    it('チップをクリックすると選択が切り替わる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<InputPage />)

      const encourageChip = screen.getByRole('radio', { name: '励まして' })
      await user.click(encourageChip)

      expect(encourageChip).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: 'なんでもOK' })).toHaveAttribute('aria-checked', 'false')
    })

    it('選択した種類がAPIに送信される', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ meaning: { title: 'テスト', body: 'テスト本文' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      render(<InputPage />)

      await user.click(screen.getByRole('radio', { name: '励まして' }))
      await user.type(screen.getByLabelText('今日やったこと'), 'バイトした')
      await user.click(screen.getByRole('button', { name: '意味を見つける' }))

      expect(mockFetch).toHaveBeenCalledWith('/api/meaning', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'バイトした', meaningType: 'encourage' }),
      }))

      mockFetch.mockRestore()
    })
  })

  describe('入力内容の一時保存（debounce）', () => {
    it('入力後3秒のdebounce後にLocalStorageに保存される', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<InputPage />)

      const textarea = screen.getByLabelText('今日やったこと')
      await user.type(textarea, 'バイトした')

      // debounce前は保存されていない
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        DRAFT_KEY,
        expect.any(String),
      )

      // 3秒経過後に保存される
      act(() => { vi.advanceTimersByTime(3000) })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DRAFT_KEY,
        JSON.stringify({ action: 'バイトした', meaningType: 'anything' }),
      )
    })

    it('意味の種類を変更するとdebounce後にLocalStorageに保存される', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<InputPage />)

      await user.type(screen.getByLabelText('今日やったこと'), 'テスト')
      await user.click(screen.getByRole('radio', { name: '励まして' }))

      act(() => { vi.advanceTimersByTime(3000) })

      const saved = JSON.parse(mockStorage.getItem(DRAFT_KEY)!)
      expect(saved.meaningType).toBe('encourage')
    })

    it('意味生成成功後にLocalStorageがクリアされる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ meaning: { title: 'テスト', body: 'テスト本文' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      render(<InputPage />)

      await user.type(screen.getByLabelText('今日やったこと'), 'バイトした')

      // debounce発火させて保存
      act(() => { vi.advanceTimersByTime(3000) })
      expect(mockStorage.getItem(DRAFT_KEY)).not.toBeNull()

      await user.click(screen.getByRole('button', { name: '意味を見つける' }))

      await waitFor(() => {
        expect(mockStorage.getItem(DRAFT_KEY)).toBeNull()
      })

      mockFetch.mockRestore()
    })

    it('空入力に戻してdebounce後にLocalStorageがクリアされる', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<InputPage />)

      const textarea = screen.getByLabelText('今日やったこと')
      await user.type(textarea, 'テスト')

      act(() => { vi.advanceTimersByTime(3000) })
      expect(mockStorage.getItem(DRAFT_KEY)).not.toBeNull()

      await user.clear(textarea)

      act(() => { vi.advanceTimersByTime(3000) })
      expect(mockStorage.getItem(DRAFT_KEY)).toBeNull()
    })

    it('LocalStorageが壊れていてもクラッシュしない', () => {
      mockStorage.setItem(DRAFT_KEY, 'invalid-json')

      expect(() => render(<InputPage />)).not.toThrow()
      expect(screen.getByLabelText('今日やったこと')).toHaveValue('')
    })
  })

  describe('復元トースト', () => {
    it('下書きがある場合トーストが表示される', () => {
      mockStorage.setItem(DRAFT_KEY, JSON.stringify({ action: '復元テスト', meaningType: 'insight' }))

      render(<InputPage />)

      expect(mockToast).toHaveBeenCalledWith(
        '前回の下書きがあります',
        expect.objectContaining({
          description: '続きから始めますか？',
          action: expect.objectContaining({ label: '続きから始める' }),
          cancel: expect.objectContaining({ label: '最初から書く' }),
        }),
      )
    })

    it('下書きがない場合トーストは表示されない', () => {
      render(<InputPage />)
      expect(mockToast).not.toHaveBeenCalled()
    })

    it('「続きから始める」で下書きが復元される', () => {
      mockStorage.setItem(DRAFT_KEY, JSON.stringify({ action: '復元テスト', meaningType: 'insight' }))

      render(<InputPage />)

      // トーストのactionコールバックを取得して実行
      const toastCall = mockToast.mock.calls[0]
      const options = toastCall[1] as { action: { onClick: () => void } }
      act(() => { options.action.onClick() })

      expect(screen.getByLabelText('今日やったこと')).toHaveValue('復元テスト')
      expect(screen.getByRole('radio', { name: '気づかせて' })).toHaveAttribute('aria-checked', 'true')
    })

    it('「最初から書く」でLocalStorageがクリアされる', () => {
      mockStorage.setItem(DRAFT_KEY, JSON.stringify({ action: '復元テスト', meaningType: 'insight' }))

      render(<InputPage />)

      const toastCall = mockToast.mock.calls[0]
      const options = toastCall[1] as { cancel: { onClick: () => void } }
      act(() => { options.cancel.onClick() })

      expect(mockStorage.getItem(DRAFT_KEY)).toBeNull()
      expect(screen.getByLabelText('今日やったこと')).toHaveValue('')
    })
  })
})
