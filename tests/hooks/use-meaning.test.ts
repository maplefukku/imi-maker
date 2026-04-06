import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMeaning } from '@/hooks/use-meaning'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useMeaning', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => useMeaning())
    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch meaning successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'テスト', body: 'テスト本文' }),
    })

    const { result } = renderHook(() => useMeaning())

    await act(async () => {
      await result.current.fetchMeaning('バイトした')
    })

    expect(result.current.result).toEqual({ title: 'テスト', body: 'テスト本文' })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useMeaning())

    await act(async () => {
      await result.current.fetchMeaning('バイトした')
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBe('うまくいかなかった。もう一回試してみて')
  })

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useMeaning())

    await act(async () => {
      await result.current.fetchMeaning('バイトした')
    })

    expect(result.current.error).toBe('うまくいかなかった。もう一回試してみて')
  })

  it('should reset state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'テスト', body: 'テスト本文' }),
    })

    const { result } = renderHook(() => useMeaning())

    await act(async () => {
      await result.current.fetchMeaning('バイトした')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should set loading state during fetch', async () => {
    let resolvePromise: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => { resolvePromise = resolve })
    )

    const { result } = renderHook(() => useMeaning())

    act(() => {
      result.current.fetchMeaning('バイトした')
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ title: 'テスト', body: 'テスト本文' }),
      })
    })
  })
})
