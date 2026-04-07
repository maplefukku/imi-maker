'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trackEvent } from '@/lib/analytics'

const ease = [0.25, 0.1, 0.25, 1] as const

const MEANING_TYPES = [
  { value: 'anything', label: 'なんでもOK' },
  { value: 'encourage', label: '励まして' },
  { value: 'insight', label: '気づかせて' },
  { value: 'action', label: '行動指針をちょうだい' },
] as const

export type MeaningType = (typeof MEANING_TYPES)[number]['value']

export default function InputPage() {
  const [action, setAction] = useState('')
  const [meaningType, setMeaningType] = useState<MeaningType>('anything')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isTooLong = action.length > 1000
  const isNearLimit = action.length > 800 && action.length <= 1000
  const isEmpty = action.trim() === ''
  const isDisabled = isEmpty || isTooLong || isLoading

  async function handleSubmit() {
    if (isDisabled) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/meaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.trim(), meaningType }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('リクエストが多すぎます。少し待ってからもう一度試してください。')
        }
        if (res.status >= 500) {
          throw new Error('サーバーで問題が発生しました。しばらくしてからもう一度試してください。')
        }
        const data = await res.json()
        throw new Error(data.error || '意味の生成に失敗しました。もう少し具体的に入力してみてください。')
      }

      const data = await res.json()
      
      // Track analytics event
      trackEvent('meaning_generated', { actionLength: action.trim().length, meaningType })
      
      const params = new URLSearchParams({
        action: action.trim(),
        title: data.meaning.title,
        body: data.meaning.body,
      })
      router.push(`/meaning?${params.toString()}`)
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('ネットワークに接続できませんでした。接続を確認してもう一度試してください。')
      } else {
        setError(err instanceof Error ? err.message : '意味の生成に失敗しました。もう少し具体的に入力してみてください。')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header showBack />
      <main className="flex flex-1 flex-col px-4 pt-8">
        <div className="mx-auto w-full max-w-screen-sm space-y-6">
          <motion.h2
            className="text-xl font-semibold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            今日、何した？
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
          >
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="バイトした、授業受けた、友達と話した…なんでもOK"
              className="min-h-[120px] rounded-2xl bg-muted/50 p-4 text-base border-border/50 resize-none"
              aria-label="今日やったこと"
            />
            <div className="mt-2 flex items-center justify-between">
              {isTooLong ? (
                <p className="text-sm text-destructive">
                  もう少し短くしてみて
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs tabular-nums transition-colors ${isTooLong ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`}
                aria-label="文字数"
              >
                {isNearLimit || isTooLong ? `残り${1000 - action.length}文字` : `${action.length}/1000`}
              </span>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.15 }}
            role="radiogroup"
            aria-label="意味の種類"
          >
            {MEANING_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                role="radio"
                aria-checked={meaningType === type.value}
                onClick={() => setMeaningType(type.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  meaningType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {type.label}
              </button>
            ))}
          </motion.div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.2 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="h-12 w-full rounded-full text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  意味を見つけてる...
                </>
              ) : (
                '意味を見つける'
              )}
            </Button>
          </motion.div>

          <motion.p
            className="text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            大したことじゃなくて全然OK
          </motion.p>
        </div>
      </main>
    </div>
  )
}
