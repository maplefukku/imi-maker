import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))

import { MeaningForm } from '@/components/meaning-form'

describe('MeaningForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
    onBack: vi.fn(),
  }

  it('should render the heading', () => {
    render(<MeaningForm {...defaultProps} />)
    expect(screen.getByText('今日、何した？')).toBeInTheDocument()
  })

  it('should render textarea', () => {
    render(<MeaningForm {...defaultProps} />)
    expect(screen.getByLabelText('今日やったこと')).toBeInTheDocument()
  })

  it('should disable button when textarea is empty', () => {
    render(<MeaningForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: '意味を見つける' })).toBeDisabled()
  })

  it('should enable button when textarea has text', async () => {
    const user = userEvent.setup()
    render(<MeaningForm {...defaultProps} />)
    await user.type(screen.getByLabelText('今日やったこと'), 'テスト')
    expect(screen.getByRole('button', { name: '意味を見つける' })).not.toBeDisabled()
  })

  it('should call onSubmit with trimmed text', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<MeaningForm {...defaultProps} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('今日やったこと'), '  バイトした  ')
    await user.click(screen.getByRole('button', { name: '意味を見つける' }))
    expect(onSubmit).toHaveBeenCalledWith('バイトした')
  })

  it('should show loading text when isLoading', () => {
    render(<MeaningForm {...defaultProps} isLoading={true} />)
    expect(screen.getByRole('button', { name: '意味を見つけてる...' })).toBeInTheDocument()
  })

  it('should show error message', () => {
    render(<MeaningForm {...defaultProps} error="エラー発生" />)
    expect(screen.getByText('エラー発生')).toBeInTheDocument()
  })

  it('should show too long error', async () => {
    const user = userEvent.setup()
    render(<MeaningForm {...defaultProps} />)
    const textarea = screen.getByLabelText('今日やったこと')
    await user.click(textarea)
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(textarea, { target: { value: 'あ'.repeat(1001) } })
    expect(screen.getByText('もう少し短くしてみて')).toBeInTheDocument()
  })

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<MeaningForm {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByText('← 戻る'))
    expect(onBack).toHaveBeenCalled()
  })

  it('should show encouraging text', () => {
    render(<MeaningForm {...defaultProps} />)
    expect(screen.getByText('大したことじゃなくて全然OK')).toBeInTheDocument()
  })
})
