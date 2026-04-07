'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, X } from 'lucide-react'
import {
  getHintsForDate,
  isHintSeenToday,
  markHintSeen,
  type Hint,
} from '@/lib/daily-hints'

const ease = [0.25, 0.1, 0.25, 1] as const

interface DailyHintsProps {
  onInsert: (text: string) => void
}

export function DailyHints({ onInsert }: DailyHintsProps) {
  const [visible, setVisible] = useState(false)
  const [hints, setHints] = useState<Hint[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (isHintSeenToday()) return
    setHints(getHintsForDate())
    setVisible(true)
  }, [])

  function handleSkip() {
    markHintSeen()
    setVisible(false)
  }

  function handleHintClick(hint: Hint) {
    onInsert(hint.example)
    markHintSeen()
    setVisible(false)
  }

  function handleDotClick(index: number) {
    setActiveIndex(index)
  }

  if (!visible || hints.length === 0) return null

  const current = hints[activeIndex]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease }}
        className="rounded-2xl border border-border/50 bg-muted/30 backdrop-blur-sm p-4"
        role="region"
        aria-label="今日のヒント"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            今日のヒント
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -mr-2 rounded-lg"
            aria-label="ヒントを閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.button
            key={activeIndex}
            type="button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleHintClick(current)}
            className="w-full text-left group"
            aria-label={`ヒント: ${current.question}`}
          >
            <p className="text-sm font-medium mb-1">{current.question}</p>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              例: 「{current.example}」
            </p>
          </motion.button>
        </AnimatePresence>

        {/* ドットインジケーター */}
        <div className="flex items-center justify-center gap-1.5 mt-3" role="tablist" aria-label="ヒント切り替え">
          {hints.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`ヒント ${i + 1}`}
              onClick={() => handleDotClick(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
