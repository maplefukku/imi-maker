'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

interface ShareButtonsProps {
  title: string
  body: string
  action: string
}

function buildShareText(title: string, body: string): string {
  const text = title ? `${title}\n${body}` : body
  return `${text}\n\n#意味メーカー`
}

export function ShareButtons({ title, body, action }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const text = buildShareText(title, body)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      trackEvent('shared', { method: 'clipboard' })
      toast('コピーしました', {
        description: 'クリップボードに保存されました',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // クリップボードAPIが使えない場合
    }
  }

  function shareToTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    trackEvent('shared', { method: 'twitter' })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function shareToLine() {
    const url = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(text)}`
    trackEvent('shared', { method: 'line' })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function shareNative() {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: title || '意味メーカー',
        text: `${action}の意味: ${body}`,
      })
      trackEvent('shared', { method: 'native' })
    } catch {
      // ユーザーがキャンセルした場合
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">シェアする</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={shareToTwitter}
        >
          <XIcon className="size-4" />
          <span>X</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={shareToLine}
        >
          <LineIcon className="size-4" />
          <span>LINE</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="size-4 text-emerald-500" />
          ) : (
            <Copy className="size-4" />
          )}
          <span>{copied ? 'コピーしました' : 'コピー'}</span>
        </Button>
        {hasNativeShare && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={shareNative}
          >
            <Share2 className="size-4" />
            <span>その他</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  )
}
