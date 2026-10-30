'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'

export function ShareArtwork({ title, locale }: { title: string; locale: Locale }) {
  const [status, setStatus] = useState('')

  async function share() {
    setStatus('')
    const url = new URL(window.location.href)
    url.hash = ''
    const data = { title, url: url.href }
    if (navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(data.url)
      setStatus(text(locale, 'Ссылка скопирована', 'Link copied'))
    } catch {
      setStatus(text(locale, 'Не удалось скопировать ссылку', 'Could not copy link'))
    }
  }

  return (
    <div className="artwork-share">
      <button type="button" className="artwork-share-button" onClick={share}>
        <Share2 size={18} aria-hidden="true" />
        {text(locale, 'Поделиться', 'Share')}
      </button>
      <span className="artwork-share-status" role="status">
        {status}
      </span>
    </div>
  )
}
