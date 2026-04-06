import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

import { MeaningResult } from '@/components/meaning-result'

describe('MeaningResult', () => {
  const defaultProps = {
    action: 'バイトした',
    result: { title: '人の感情を読む力', body: '接客って、相手が何を求めてるかを読むトレーニングかもね。' },
    isLoading: false,
    onAnother: vi.fn(),
    onHome: vi.fn(),
  }

  it('should show loading skeleton when isLoading', () => {
    render(<MeaningResult {...defaultProps} isLoading={true} result={null} />)
    expect(screen.getByText('意味を見つけてる...')).toBeInTheDocument()
  })

  it('should display action text', () => {
    render(<MeaningResult {...defaultProps} />)
    expect(screen.getByText('バイトした')).toBeInTheDocument()
  })

  it('should display meaning title and body', () => {
    render(<MeaningResult {...defaultProps} />)
    expect(screen.getByText('人の感情を読む力')).toBeInTheDocument()
    expect(screen.getByText(/接客って/)).toBeInTheDocument()
  })

  it('should show "見つけた意味" label', () => {
    render(<MeaningResult {...defaultProps} />)
    expect(screen.getByText('見つけた意味')).toBeInTheDocument()
  })

  it('should call onAnother when button clicked', async () => {
    const user = userEvent.setup()
    const onAnother = vi.fn()
    render(<MeaningResult {...defaultProps} onAnother={onAnother} />)
    await user.click(screen.getByRole('button', { name: 'もう1つ入力する' }))
    expect(onAnother).toHaveBeenCalled()
  })

  it('should call onHome when button clicked', async () => {
    const user = userEvent.setup()
    const onHome = vi.fn()
    render(<MeaningResult {...defaultProps} onHome={onHome} />)
    await user.click(screen.getByRole('button', { name: '最初に戻る' }))
    expect(onHome).toHaveBeenCalled()
  })

  it('should return null when no result and not loading', () => {
    const { container } = render(
      <MeaningResult {...defaultProps} result={null} isLoading={false} />
    )
    expect(container.firstChild).toBeNull()
  })
})
