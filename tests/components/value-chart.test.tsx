import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValueChart } from '@/components/value-chart'
import type { ValueAnalysis } from '@/lib/value-analyzer'

vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, transition, ...rest } = props
      return <section {...rest}>{children as React.ReactNode}</section>
    },
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, transition, ...rest } = props
      return <div {...rest}>{children as React.ReactNode}</div>
    },
  },
}))

describe('ValueChart', () => {
  const mockAnalysis: ValueAnalysis = {
    topValues: [
      { value: '成長', score: 5, percentage: 50 },
      { value: '挑戦', score: 3, percentage: 30 },
      { value: '学び', score: 2, percentage: 20 },
    ],
    totalMeanings: 10,
    insight: '自分を高めたいという向上心が原動力になっています',
  }

  it('価値観チャートが表示される', () => {
    render(<ValueChart analysis={mockAnalysis} />)
    expect(screen.getByTestId('value-chart')).toBeInTheDocument()
    expect(screen.getByText('あなたの価値観')).toBeInTheDocument()
  })

  it('件数が表示される', () => {
    render(<ValueChart analysis={mockAnalysis} />)
    expect(screen.getByText('10件の意味から分析')).toBeInTheDocument()
  })

  it('価値観バーが表示される', () => {
    render(<ValueChart analysis={mockAnalysis} />)
    expect(screen.getByTestId('value-bars')).toBeInTheDocument()
    expect(screen.getByText('成長')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('挑戦')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('insightが表示される', () => {
    render(<ValueChart analysis={mockAnalysis} />)
    expect(screen.getByTestId('value-insight')).toBeInTheDocument()
    expect(screen.getByText('自分を高めたいという向上心が原動力になっています')).toBeInTheDocument()
  })

  it('analysisがnullの場合何も表示しない', () => {
    const { container } = render(<ValueChart analysis={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('topValuesが空の場合何も表示しない', () => {
    const emptyAnalysis: ValueAnalysis = {
      topValues: [],
      totalMeanings: 3,
      insight: '',
    }
    const { container } = render(<ValueChart analysis={emptyAnalysis} />)
    expect(container.innerHTML).toBe('')
  })
})
