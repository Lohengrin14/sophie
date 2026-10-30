'use client'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Brand } from '@/lib/brand'
import { purchaseLink } from '@/lib/purchase-link'
import { text, type Locale } from '@/lib/i18n'
export function BuyLink({
  brand,
  locale,
  title,
  path,
}: {
  brand: Brand
  locale: Locale
  title: string
  path: string
}) {
  const [url, setURL] = useState(path)
  useEffect(() => setURL(new URL(path, window.location.origin).href), [path])
  const target = purchaseLink(brand, locale, title, url)
  return target ? (
    <a
      className="button primary full buy-link"
      href={target.href}
      target={target.href.startsWith('mailto:') ? undefined : '_blank'}
      rel="noreferrer"
    >
      {text(locale, 'Купить', 'Buy')}
      <ArrowUpRight size={17} />
      <span className="buy-channel">{target.channel}</span>
    </a>
  ) : (
    <span className="purchase-unconfigured">
      {text(
        locale,
        'Контакты для покупки появятся здесь.',
        'Purchase contact details will appear here.',
      )}
    </span>
  )
}
