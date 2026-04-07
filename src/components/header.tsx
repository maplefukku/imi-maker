'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ArrowLeft, Clock, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center px-4">
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            <span>戻る</span>
          </Button>
        ) : (
          <div />
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            asChild
          >
            <Link href="/history">
              <Clock className="size-4" />
              <span>履歴</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={toggleTheme}
            aria-label="テーマ切替"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
            <span>テーマ</span>
          </Button>
          <span className="text-lg font-semibold tracking-tight">
            意味メーカー
          </span>
        </div>
      </div>
    </header>
  )
}
