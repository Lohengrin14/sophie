'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { availabilityLabel, mediumLabel, money, text, type Locale } from '@/lib/i18n'
export type CatalogItem = {
  id: string | number
  slug: string
  title: string
  image: string
  width: number
  height: number
  priceMinor: number
  currency: string
  medium: string
  availability: string
  demo: boolean
}
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
          {visible.length} {text(locale, 'работы в коллекции', 'works in this collection')}
        </span>
      </div>
      <div className="artwork-grid">
        {visible.map((work, i) => (
          <Link key={work.id} href={`/${locale}/works/${work.slug}`} className="artwork-card">
            <div className={`artwork-image artwork-image-${i % 3}`}>
              <Image
                src={work.image}
                alt={work.title}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              />
              <span
                className={`availability ${work.availability === 'available' ? 'available' : ''}`}
              >
                <i />
                {availabilityLabel(work.availability, locale)}
              </span>
              <span className="card-open">
                <ArrowUpRight size={20} />
              </span>
            </div>
            <div className="artwork-info">
              <div>
                <h3>{work.title}</h3>
                <p>
                  {mediumLabel(work.medium, locale)} · {work.width} × {work.height}{' '}
                  {text(locale, 'см', 'cm')}
                </p>
              </div>
              <span className="artwork-price">
                {work.availability === 'sold'
                  ? text(locale, 'Продана', 'Sold')
                  : money(work.priceMinor, work.currency, locale)}
              </span>
            </div>
            {work.demo && (
              <span className="demo-caption">
                {text(locale, 'Демонстрационная работа и цена', 'Illustrative artwork and price')}
              </span>
            )}
          </Link>
        ))}
      </div>
      {visible.length === 0 && (
        <div className="empty-state">
          <h3>{text(locale, 'Здесь пока тихо', 'A little quiet here')}</h3>
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
