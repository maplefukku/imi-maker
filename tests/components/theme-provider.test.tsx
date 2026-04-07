import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}))

import { ThemeProvider } from '@/components/theme-provider'

describe('ThemeProvider', () => {
  it('子要素をレンダリングする', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <p>テスト子要素</p>
      </ThemeProvider>
    )
    expect(screen.getByText('テスト子要素')).toBeInTheDocument()
  })

  it('propsをNextThemesProviderに渡す', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <span>内容</span>
      </ThemeProvider>
    )
    const provider = screen.getByTestId('theme-provider')
    const props = JSON.parse(provider.getAttribute('data-props') || '{}')
    expect(props.attribute).toBe('class')
    expect(props.defaultTheme).toBe('dark')
    expect(props.enableSystem).toBe(true)
  })
})
