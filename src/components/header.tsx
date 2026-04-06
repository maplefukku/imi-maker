'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter()

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
        <span className="ml-auto text-lg font-semibold tracking-tight">
          意味メーカー
        </span>
      </div>
    </header>
  )
}
