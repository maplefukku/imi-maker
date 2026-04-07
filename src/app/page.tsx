'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { createClient } from '@/lib/supabase/client'

const ease = [0.25, 0.1, 0.25, 1] as const

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-screen-sm space-y-8 text-center">
          <motion.h1
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            今日やったこと、
            <br />
            意味あるかも。
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.1 }}
          >
            入力するだけ。
            <br />
            AIが勝手に意味を見つけます
          </motion.p>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.2 }}
          >
            <Link href="/input">
              <Button
                className="h-12 rounded-full px-8 text-base font-semibold hover:bg-primary/90 active:scale-95 transition-transform"
              >
                やってみる
              </Button>
            </Link>
            {isLoggedIn && (
              <div className="pt-2">
                <Link href="/history">
                  <Button
                    variant="ghost"
                    className="h-10 rounded-full px-6 text-sm"
                  >
                    履歴を見る
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
