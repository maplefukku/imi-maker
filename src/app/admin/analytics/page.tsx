'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { getEventStats, clearEvents } from '@/lib/analytics'
import { Button } from '@/components/ui/button'

interface EventStats {
  total: number
  byType: Record<string, number>
  last24h: number
}

const EVENT_LABELS: Record<string, string> = {
  meaning_generated: '意味を生成',
  history_viewed: '履歴を閲覧',
  session_viewed: 'セッション詳細を閲覧',
  shared: 'シェア',
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<EventStats | null>(null)

  useEffect(() => {
    setStats(getEventStats())
  }, [])

  function handleClear() {
    clearEvents()
    setStats(getEventStats())
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      <main className="mx-auto max-w-screen-sm px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">アナリティクス</h1>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-sm text-muted-foreground"
            onClick={handleClear}
          >
            リセット
          </Button>
        </div>

        {stats && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">合計イベント</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">直近24時間</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {stats.last24h}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 shadow-sm">
              <div className="border-b border-border/50 px-5 py-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  イベント別
                </h2>
              </div>
              <div className="divide-y divide-border/50">
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm">{label}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {stats.byType[key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
