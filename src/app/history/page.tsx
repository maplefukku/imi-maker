'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Meaning } from '@/types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

export default function HistoryPage() {
  const [meanings, setMeanings] = useState<Meaning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-center text-muted-foreground">{error}</p>
        )}

        {!loading && !error && meanings.length === 0 && (
          <p className="text-center text-muted-foreground">
            まだ履歴がありません
          </p>
        )}

        {!loading && !error && meanings.length > 0 && (
          <div className="space-y-4">
            {meanings.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardDescription>{formatDate(m.created_at)}</CardDescription>
                    <CardTitle>{truncate(m.action, 40)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {m.title ?? m.meaning}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
