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

  return (
    <div className="space-y-4">
      {meanings.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={`/history/${m.id}`} className="block">
            <Card className="rounded-2xl shadow-sm transition-colors hover:bg-muted/30">
              <CardHeader>
                <CardDescription>{formatDate(m.created_at)}</CardDescription>
                <CardTitle>{truncate(m.action, 40)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {m.title ?? truncate(m.meaning, 100)}
                  </p>
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
      ))}
    </div>
  )
}
