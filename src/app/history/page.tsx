'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { SessionList } from '@/components/session-list'
import { getMonthlySummary } from '@/lib/tags'
import { trackEvent } from '@/lib/analytics'
import type { Meaning } from '@/types'

function MonthlySummary({ meanings }: { meanings: Meaning[] }) {
  const { count, tags } = getMonthlySummary(meanings)

  if (count === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border bg-card p-5 shadow-sm"
      data-testid="monthly-summary"
    >
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">
        今月の意味
      </h2>
      <p className="mb-3 text-2xl font-bold tracking-tight">
        {count}
        <span className="ml-1 text-base font-normal text-muted-foreground">件</span>
      </p>
      {tags.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">今月の傾向</p>
          <div className="flex flex-wrap gap-1.5" data-testid="monthly-tags">
            {tags.slice(0, 5).map(({ tag, count: c }) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                #{tag} ({c})
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default function HistoryPage() {
  const [meanings, setMeanings] = useState<Meaning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
        {!loading && !error && <MonthlySummary meanings={meanings} />}
        <SessionList meanings={meanings} loading={loading} error={error} />
      </main>
    </div>
  )
}
