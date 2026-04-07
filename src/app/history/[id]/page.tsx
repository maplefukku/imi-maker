'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { ShareButtons } from '@/components/share-buttons'
import { trackEvent } from '@/lib/analytics'
import type { Meaning } from '@/types'

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const [meaning, setMeaning] = useState<Meaning | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent('session_viewed', { meaningId: params.id })

    async function fetchMeaning() {
      try {
        const res = await fetch(`/api/meanings/${params.id}`)
        if (!res.ok) throw new Error('取得に失敗しました')
        const data = await res.json()
        setMeaning(data.meaning)
      } catch {
        setError('この履歴は見つかりませんでした')
      } finally {
        setLoading(false)
      }
    }
    fetchMeaning()
  }, [params.id])

  return (
    <div className="flex min-h-full flex-col">
      <Header showBack />
      <main className="flex flex-1 flex-col px-4 pt-8 pb-12">
        <div className="mx-auto w-full max-w-screen-sm">
          {loading && (
            <div className="space-y-6">
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            </div>
          )}

          {error && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Link href="/history">
                <Button className="h-12 rounded-full px-8 text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform">
                  履歴に戻る
                </Button>
              </Link>
            </div>
          )}

          {!loading && !error && meaning && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <p className="mb-2 text-sm text-muted-foreground">あなたがやったこと</p>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-base">{meaning.action}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium tracking-wider text-muted-foreground">
                  見つけた意味
                </span>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/50 shadow-sm p-6">
                {meaning.title && (
                  <h2 className="text-lg font-semibold">{meaning.title}</h2>
                )}
                <p className="text-base leading-relaxed text-muted-foreground">
                  {meaning.meaning}
                </p>
              </div>

              {meaning.suggestions && meaning.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-medium tracking-wider text-muted-foreground">
                      アクション提案
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {meaning.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-2xl border border-border/50 p-4 text-sm leading-relaxed"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {new Date(meaning.created_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              <ShareButtons
                title={meaning.title ?? ''}
                body={meaning.meaning}
                action={meaning.action}
              />

              <div className="space-y-4 pt-4">
                <Link href="/input" className="block">
                  <Button className="h-12 w-full rounded-full text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform">
                    もう1つ入力する
                  </Button>
                </Link>
                <Link href="/history" className="block">
                  <Button
                    variant="ghost"
                    className="h-12 w-full rounded-full text-base"
                  >
                    履歴に戻る
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
