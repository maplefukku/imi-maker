'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { SessionList } from '@/components/session-list'
import { trackEvent } from '@/lib/analytics'
import type { Meaning } from '@/types'

export default function HistoryPage() {
  const [meanings, setMeanings] = useState<Meaning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Track analytics event
    trackEvent('history_viewed')

    async function fetchMeanings() {
      try {
        const res = await fetch('/api/meanings')
        if (!res.ok) throw new Error('取得に失敗しました')
        const data = await res.json()
        setMeanings(data.meanings)
      } catch {
        setError('履歴の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchMeanings()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      <main className="mx-auto max-w-screen-sm px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">履歴</h1>
        <SessionList meanings={meanings} loading={loading} error={error} />
      </main>
    </div>
  )
}
