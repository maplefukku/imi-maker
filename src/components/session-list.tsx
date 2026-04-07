'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { generateTags } from '@/lib/tags'
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

function groupByDate(meanings: Meaning[]): Map<string, Meaning[]> {
  const groups = new Map<string, Meaning[]>()
  for (const m of meanings) {
    const key = formatDate(m.created_at)
    const list = groups.get(key) ?? []
    list.push(m)
    groups.set(key, list)
  }
  return groups
}

interface SessionListProps {
  meanings: Meaning[]
  loading: boolean
  error: string | null
}

export function SessionList({ meanings, loading, error }: SessionListProps) {
  if (loading) {
    return (
      <div className="space-y-4" data-testid="session-list-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-center text-muted-foreground">{error}</p>
    )
  }

  if (meanings.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        まだ履歴がありません
      </p>
    )
  }

  const grouped = groupByDate(meanings)
  let itemIndex = 0

  return (
    <div className="relative" data-testid="timeline">
      {/* タイムラインの縦線 */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([date, items]) => (
          <div key={date}>
            {/* 日付ラベル */}
            <div className="relative mb-4 flex items-center gap-3">
              <div className="z-10 h-2.5 w-2.5 rounded-full bg-foreground/60 ring-4 ring-background" />
              <span className="text-sm font-medium text-muted-foreground">
                {date}
              </span>
            </div>

            {/* その日のカード群 */}
            <div className="ml-10 space-y-3">
              {items.map((m) => {
                const tags = generateTags(m.meaning)
                const idx = itemIndex++
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link href={`/history/${m.id}`} className="block">
                      <Card className="rounded-2xl shadow-sm transition-colors hover:bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {truncate(m.action, 40)}
                          </CardTitle>
                          <CardDescription>
                            {m.title ?? truncate(m.meaning, 100)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5" data-testid="tags">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full shrink-0 ml-2"
                              tabIndex={-1}
                            >
                              詳細を見る
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
