'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareButtons } from '@/components/share-buttons'

interface ActionItem {
  id: string
  text: string
}

interface DeepDiveQuestion {
  id: string
  text: string
}

interface DeepDiveEntry {
  type: 'questions' | 'meaning'
  questions?: DeepDiveQuestion[]
  meaning?: { title: string; body: string }
}

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

const COMPLETED_ACTIONS_KEY = 'imi-maker-completed-actions'

function getCompletedActions(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_ACTIONS_KEY) || '{}')
  } catch {
    return {}
  }
}

function toggleCompletedAction(actionKey: string, completed: boolean) {
  const current = getCompletedActions()
  if (completed) {
    current[actionKey] = true
  } else {
    delete current[actionKey]
  }
  localStorage.setItem(COMPLETED_ACTIONS_KEY, JSON.stringify(current))
}

function ActionProposal({
  action,
  title,
  body,
}: {
  action: string
  title: string
  body: string
}) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setCompletedMap(getCompletedActions())
  }, [])

  const fetchActions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          meaningTitle: title,
          meaningBody: body,
        }),
      })
      if (!res.ok) {
        throw new Error('アクション提案の取得に失敗しました')
      }
      const data = await res.json()
      setActions(data.actions)
      setShowActions(true)
    } catch {
      setError('提案の取得に失敗しました。もう一度試してみてください。')
    } finally {
      setLoading(false)
    }
  }, [action, title, body])

  const handleToggle = (actionId: string) => {
    const key = `${action}-${actionId}`
    const newCompleted = !completedMap[key]
    toggleCompletedAction(key, newCompleted)
    setCompletedMap(getCompletedActions())
  }

  if (!showActions) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={fetchActions}
          disabled={loading}
          className="h-12 w-full rounded-full border border-border/50 bg-transparent text-base font-semibold text-foreground hover:bg-muted/50 active:scale-95 transition-transform"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              考え中...
            </span>
          ) : (
            'これを活かす最初の一歩'
          )}
        </Button>
        {error && (
          <p className="mt-2 text-center text-sm text-destructive">{error}</p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-medium tracking-wider text-muted-foreground">
          最初の一歩
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {actions.map((item, i) => {
            const key = `${action}-${item.id}`
            const isCompleted = !!completedMap[key]
            return (
              <motion.label
                key={item.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 p-4 transition-colors ${
                  isCompleted
                    ? 'bg-muted/20 text-muted-foreground'
                    : 'hover:bg-muted/30'
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => handleToggle(item.id)}
                  className="size-5 rounded-md border-2 border-border accent-emerald-500 transition-colors"
                />
                <span
                  className={`text-sm leading-relaxed ${
                    isCompleted ? 'line-through' : ''
                  }`}
                >
                  {item.text}
                </span>
              </motion.label>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const MAX_DEPTH = 3

function DeepDive({
  action,
  title,
  body,
}: {
  action: string
  title: string
  body: string
}) {
  const [entries, setEntries] = useState<DeepDiveEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [currentTitle, setCurrentTitle] = useState(title)
  const [currentBody, setCurrentBody] = useState(body)

  const depth = entries.filter((e) => e.type === 'meaning').length

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          meaningTitle: currentTitle,
          meaningBody: currentBody,
          conversation,
          mode: 'questions',
        }),
      })
      if (!res.ok) throw new Error('質問の生成に失敗しました')
      const data = await res.json()
      setEntries((prev) => [...prev, { type: 'questions', questions: data.questions }])
      setStarted(true)
    } catch {
      setError('質問の生成に失敗しました。もう一度試してみてください。')
    } finally {
      setLoading(false)
    }
  }, [action, currentTitle, currentBody, conversation])

  const handleQuestionSelect = useCallback(async (questionText: string) => {
    setLoading(true)
    setError(null)

    const newConversation: ConversationEntry[] = [
      ...conversation,
      { role: 'assistant', content: `見つけた意味: ${currentTitle} — ${currentBody}` },
      { role: 'user', content: questionText },
    ]

    try {
      const res = await fetch('/api/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          meaningTitle: currentTitle,
          meaningBody: currentBody,
          conversation: newConversation,
          mode: 'meaning',
        }),
      })
      if (!res.ok) throw new Error('意味の生成に失敗しました')
      const data = await res.json()
      const newMeaning = data.meaning as { title: string; body: string }

      setConversation(newConversation)
      setCurrentTitle(newMeaning.title)
      setCurrentBody(newMeaning.body)
      setEntries((prev) => [...prev, { type: 'meaning', meaning: newMeaning }])
    } catch {
      setError('深掘りに失敗しました。もう一度試してみてください。')
    } finally {
      setLoading(false)
    }
  }, [action, currentTitle, currentBody, conversation])

  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={fetchQuestions}
          disabled={loading}
          className="h-12 w-full rounded-full border border-border/50 bg-transparent text-base font-semibold text-foreground hover:bg-muted/50 active:scale-95 transition-transform"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              考え中...
            </span>
          ) : (
            'もっと深掘り'
          )}
        </Button>
        {error && (
          <p className="mt-2 text-center text-sm text-destructive">{error}</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) => {
        if (entry.type === 'questions' && entry.questions) {
          const isCurrent = idx === entries.length - 1 && !loading
          return (
            <motion.div
              key={idx}
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-medium tracking-wider text-muted-foreground">
                  深掘りの問い
                </span>
              </div>
              {entry.questions.map((q, qi) => (
                <motion.button
                  key={q.id}
                  disabled={!isCurrent || loading}
                  onClick={() => isCurrent && handleQuestionSelect(q.text)}
                  className={`w-full text-left rounded-2xl border border-border/50 p-4 text-sm leading-relaxed transition-colors ${
                    isCurrent
                      ? 'hover:bg-muted/30 cursor-pointer'
                      : 'opacity-50 cursor-default'
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qi * 0.1 }}
                >
                  {q.text}
                </motion.button>
              ))}
            </motion.div>
          )
        }

        if (entry.type === 'meaning' && entry.meaning) {
          return (
            <motion.div
              key={idx}
              className="space-y-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium tracking-wider text-muted-foreground">
                  新たな意味
                </span>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/50 shadow-sm p-6">
                <h3 className="text-lg font-semibold">{entry.meaning.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {entry.meaning.body}
                </p>
              </div>
            </motion.div>
          )
        }

        return null
      })}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">考え中...</span>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {!loading && depth < MAX_DEPTH && entries.length > 0 && entries[entries.length - 1].type === 'meaning' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            onClick={fetchQuestions}
            disabled={loading}
            className="h-12 w-full rounded-full border border-border/50 bg-transparent text-base font-semibold text-foreground hover:bg-muted/50 active:scale-95 transition-transform"
          >
            さらに深掘り
          </Button>
        </motion.div>
      )}

      {depth >= MAX_DEPTH && (
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          深掘りは3段階まで。新しい入力で別の角度から探ってみよう。
        </motion.p>
      )}
    </div>
  )
}

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

      <ActionProposal action={action} title={title} body={body} />

      <DeepDive action={action} title={title} body={body} />

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
