import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { ShareButtons } from '@/components/share-buttons'

describe('ShareButtons', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('X、LINE、コピーボタンが表示される', () => {
    render(<ShareButtons title="テスト" body="本文" action="テスト行動" />)
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText('LINE')).toBeInTheDocument()
    expect(screen.getByText('コピー')).toBeInTheDocument()
  })

  it('Xボタンをクリックするとwindow.openが呼ばれる', async () => {
    const user = userEvent.setup()
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)

    render(<ShareButtons title="テスト" body="本文" action="テスト行動" />)
    await user.click(screen.getByText('X'))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('LINEボタンをクリックするとwindow.openが呼ばれる', async () => {
    const user = userEvent.setup()
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)

    render(<ShareButtons title="テスト" body="本文" action="テスト行動" />)
    await user.click(screen.getByText('LINE'))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('social-plugins.line.me'),
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('コピーボタンをクリックするとクリップボードにコピーされる', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<ShareButtons title="テスト" body="本文" action="テスト行動" />)
    await user.click(screen.getByText('コピー'))

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('#意味メーカー')
    )
  })

  it('コピー後に「コピーしました」が表示される', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<ShareButtons title="テスト" body="本文" action="テスト行動" />)
    await user.click(screen.getByText('コピー'))

    expect(await screen.findByText('コピーしました')).toBeInTheDocument()
  })

  it('シェアテキストにタイトルと本文が含まれる', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })

    render(<ShareButtons title="テストタイトル" body="テスト本文" action="行動" />)
    await user.click(screen.getByText('コピー'))

    const calledText = mockWriteText.mock.calls[0][0]
    expect(calledText).toContain('テストタイトル')
    expect(calledText).toContain('テスト本文')
    expect(calledText).toContain('#意味メーカー')
  })
})
