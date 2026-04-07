import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSearchParams = new URLSearchParams()

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

vi.mock('@/components/share-buttons', () => ({
  ShareButtons: () => <div data-testid="share-buttons">シェア</div>,
}))

import MeaningPage from '@/app/meaning/page'

describe('意味表示ページ', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const storage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
      removeItem: vi.fn((key: string) => { delete storage[key] }),
    })
  })

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

  it('actionのみでtitle/bodyがない場合はスケルトンが表示される', () => {
    mockSearchParams.set('action', 'バイトした')
    mockSearchParams.delete('title')
    mockSearchParams.delete('body')

    render(<MeaningPage />)
    // スケルトンが表示される（結果テキストは表示されない）
    expect(screen.queryByText('見つけた意味')).not.toBeInTheDocument()
    expect(screen.queryByText('表示する意味がありません')).not.toBeInTheDocument()
  })
})

describe('DeepDive', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const storage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
      removeItem: vi.fn((key: string) => { delete storage[key] }),
    })
    mockSearchParams.set('action', 'テスト行動')
    mockSearchParams.set('title', 'テストタイトル')
    mockSearchParams.set('body', 'テスト本文')
  })

  it('「もっと深掘り」ボタンが表示される', () => {
    render(<MeaningPage />)
    expect(screen.getByRole('button', { name: 'もっと深掘り' })).toBeInTheDocument()
  })

  it('ボタンクリックで質問を取得し表示する', async () => {
    const user = userEvent.setup()
    const mockQuestions = {
      questions: [
        { id: '1', text: '質問1' },
        { id: '2', text: '質問2' },
        { id: '3', text: '質問3' },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockQuestions),
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'もっと深掘り' }))

    await waitFor(() => {
      expect(screen.getByText('質問1')).toBeInTheDocument()
      expect(screen.getByText('質問2')).toBeInTheDocument()
      expect(screen.getByText('質問3')).toBeInTheDocument()
    })
    expect(screen.getByText('深掘りの問い')).toBeInTheDocument()
  })

  it('質問クリックで新しい意味が生成される', async () => {
    const user = userEvent.setup()
    const mockQuestions = {
      questions: [
        { id: '1', text: '質問1' },
        { id: '2', text: '質問2' },
        { id: '3', text: '質問3' },
      ],
    }
    const mockMeaning = {
      meaning: { title: '新たな発見', body: '深掘りで見つかった新しい意味です。' },
    }

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuestions),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMeaning),
      })
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'もっと深掘り' }))

    await waitFor(() => {
      expect(screen.getByText('質問1')).toBeInTheDocument()
    })

    await user.click(screen.getByText('質問1'))

    await waitFor(() => {
      expect(screen.getByText('新たな発見')).toBeInTheDocument()
      expect(screen.getByText('深掘りで見つかった新しい意味です。')).toBeInTheDocument()
    })
    expect(screen.getByText('新たな意味')).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'もっと深掘り' }))

    await waitFor(() => {
      expect(screen.getByText('質問の生成に失敗しました。もう一度試してみてください。')).toBeInTheDocument()
    })
  })

  it('ローディング中に「考え中...」が表示される', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => { resolvePromise = resolve })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise))

    const user = userEvent.setup()
    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'もっと深掘り' }))

    expect(screen.getByText('考え中...')).toBeInTheDocument()

    resolvePromise!({ ok: true, json: () => Promise.resolve({ questions: [] }) })
  })

  it('3段階深掘り後に上限メッセージが表示される', async () => {
    const user = userEvent.setup()
    const mockQuestions = {
      questions: [
        { id: '1', text: '質問A' },
        { id: '2', text: '質問B' },
        { id: '3', text: '質問C' },
      ],
    }

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      // Odd calls: questions, Even calls: meaning
      if (callCount % 2 === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuestions),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          meaning: { title: `意味${callCount / 2}`, body: `本文${callCount / 2}` },
        }),
      })
    }))

    render(<MeaningPage />)

    // Depth 1: click deep dive -> questions -> select question -> meaning
    await user.click(screen.getByRole('button', { name: 'もっと深掘り' }))
    await waitFor(() => { expect(screen.getByText('質問A')).toBeInTheDocument() })
    await user.click(screen.getByText('質問A'))
    await waitFor(() => { expect(screen.getByText('意味1')).toBeInTheDocument() })

    // Depth 2
    await user.click(screen.getByRole('button', { name: 'さらに深掘り' }))
    await waitFor(() => { expect(screen.getAllByText('質問A').length).toBeGreaterThan(0) })
    const questionButtons = screen.getAllByText('質問A')
    await user.click(questionButtons[questionButtons.length - 1])
    await waitFor(() => { expect(screen.getByText('意味2')).toBeInTheDocument() })

    // Depth 3
    await user.click(screen.getByRole('button', { name: 'さらに深掘り' }))
    await waitFor(() => { expect(screen.getAllByText('質問A').length).toBeGreaterThan(0) })
    const questionButtons3 = screen.getAllByText('質問A')
    await user.click(questionButtons3[questionButtons3.length - 1])
    await waitFor(() => { expect(screen.getByText('意味3')).toBeInTheDocument() })

    // Should show max depth message
    await waitFor(() => {
      expect(screen.getByText('深掘りは3段階まで。新しい入力で別の角度から探ってみよう。')).toBeInTheDocument()
    })
  })
})

describe('ActionProposal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const storage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
      removeItem: vi.fn((key: string) => { delete storage[key] }),
    })
    mockSearchParams.set('action', 'テスト行動')
    mockSearchParams.set('title', 'テストタイトル')
    mockSearchParams.set('body', 'テスト本文')
  })

  it('「これを活かす最初の一歩」ボタンが表示される', () => {
    render(<MeaningPage />)
    expect(screen.getByRole('button', { name: 'これを活かす最初の一歩' })).toBeInTheDocument()
  })

  it('ボタンクリックでアクションを取得し表示する', async () => {
    const user = userEvent.setup()
    const mockActions = {
      actions: [
        { id: '1', text: 'アクション1' },
        { id: '2', text: 'アクション2' },
        { id: '3', text: 'アクション3' },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActions),
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'これを活かす最初の一歩' }))

    await waitFor(() => {
      expect(screen.getByText('アクション1')).toBeInTheDocument()
      expect(screen.getByText('アクション2')).toBeInTheDocument()
      expect(screen.getByText('アクション3')).toBeInTheDocument()
    })
    expect(screen.getByText('最初の一歩')).toBeInTheDocument()
  })

  it('APIエラー時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'これを活かす最初の一歩' }))

    await waitFor(() => {
      expect(screen.getByText('提案の取得に失敗しました。もう一度試してみてください。')).toBeInTheDocument()
    })
  })

  it('ネットワークエラー時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'これを活かす最初の一歩' }))

    await waitFor(() => {
      expect(screen.getByText('提案の取得に失敗しました。もう一度試してみてください。')).toBeInTheDocument()
    })
  })

  it('チェックボックスをトグルできる', async () => {
    const user = userEvent.setup()
    const mockActions = {
      actions: [
        { id: '1', text: 'アクション1' },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActions),
    }))

    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'これを活かす最初の一歩' }))

    await waitFor(() => {
      expect(screen.getByText('アクション1')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('ローディング中に「考え中...」が表示される', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => { resolvePromise = resolve })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pendingPromise))

    const user = userEvent.setup()
    render(<MeaningPage />)
    await user.click(screen.getByRole('button', { name: 'これを活かす最初の一歩' }))

    expect(screen.getByText('考え中...')).toBeInTheDocument()

    // cleanup
    resolvePromise!({ ok: true, json: () => Promise.resolve({ actions: [] }) })
  })
})
