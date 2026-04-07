'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareButtons } from '@/components/share-buttons'

function MeaningSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-muted/30 p-4">
        <Skeleton className="h-5 w-3/4 animate-shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-muted" />
        <Skeleton className="h-3 w-24 animate-shimmer" />
      </div>
      <div className="space-y-4 rounded-2xl bg-muted/30 p-6">
        <Skeleton className="h-6 w-1/2 animate-shimmer" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full animate-shimmer" />
          <Skeleton className="h-4 w-5/6 animate-shimmer" />
          <Skeleton className="h-4 w-4/6 animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

function MeaningContent() {
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const title = searchParams.get('title')
  const body = searchParams.get('body')

  const isLoading = !title || !body

  if (!action) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">表示する意味がありません</p>
        <Link href="/input">
          <Button className="h-12 rounded-full px-8 text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform">
            入力する
          </Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <MeaningSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">あなたがやったこと</p>
        <div className="rounded-2xl bg-muted/30 p-4">
          <p className="text-base">{action}</p>
        </div>
      </div>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium tracking-wider text-muted-foreground">
          見つけた意味
        </span>
      </motion.div>

      <motion.div
        className="space-y-4 rounded-2xl border border-border/50 shadow-sm p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.3,
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {body}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ShareButtons title={title} body={body} action={action} />
      </motion.div>

      <motion.div
        className="space-y-4 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link href="/input" className="block">
          <Button className="h-12 w-full rounded-full text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform">
            もう1つ入力する
          </Button>
        </Link>
        <Link href="/" className="block">
          <Button
            variant="ghost"
            className="h-12 w-full rounded-full text-base"
          >
            最初に戻る
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

export default function MeaningPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Header showBack />
      <main className="flex flex-1 flex-col px-4 pt-8 pb-12">
        <div className="mx-auto w-full max-w-screen-sm">
          <Suspense fallback={<MeaningSkeleton />}>
            <MeaningContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
