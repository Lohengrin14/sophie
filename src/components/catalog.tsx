'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import { ArtworkCard } from '@/components/artwork-card'
import type { CatalogItem } from '@/lib/catalog-item'
export function Catalog({ works, locale }: { works: CatalogItem[]; locale: Locale }) {
  const [filter, setFilter] = useState('all')
  const visible = works.filter(
    (w) =>
      filter === 'all' ||
      (filter === 'available' ? w.availability === 'available' : w.availability === 'sold'),
  )
  return (
    <>
      <div className="catalog-toolbar">
        <div className="filter-group" aria-label={text(locale, 'Фильтр работ', 'Filter works')}>
          {[
            ['all', text(locale, 'Все работы', 'All works')],
            ['available', text(locale, 'Доступны', 'Available')],
            ['sold', text(locale, 'В коллекциях', 'Collected')],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? 'selected' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="result-count">
          {text(locale, 'Работ:', 'Works:')} {visible.length}
        </span>
      </div>
      <div className="artwork-grid">
        {visible.map((work, i) => (
          <ArtworkCard key={work.id} work={work} locale={locale} priority={i < 3} />
        ))}
      </div>
      {visible.length === 0 && (
        <div className="empty-state">
          <h2>
            {text(
              locale,
              works.length ? 'В этом разделе пока нет работ' : 'Работы скоро появятся',
              works.length ? 'No works in this section yet' : 'New works coming soon',
            )}
          </h2>
          <p>
            {text(
              locale,
              'Попробуйте другой фильтр или обсудим вашу собственную картину.',
              'Try another filter, or let’s talk about a painting of your own.',
            )}
          </p>
          <Link className="text-link" href={`/${locale}/commission`}>
            {text(locale, 'Картина на заказ', 'Commission a painting')} <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </>
  )
}
