import Link from 'next/link'
import { CanvasImage } from '@/components/canvas-image'
import type { CatalogItem } from '@/lib/catalog-item'
import { availabilityLabel, mediumLabel, money, type Locale, text } from '@/lib/i18n'
export function ArtworkCard({
  work,
  locale,
  priority = false,
}: {
  work: CatalogItem
  locale: Locale
  priority?: boolean
}) {
  return (
    <Link href={`/${locale}/works/${work.slug}`} className="artwork-card">
      <CanvasImage
        className="artwork-image"
        src={work.image}
        alt={work.title}
        width={work.width}
        height={work.height}
        priority={priority}
        sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
      />
      <div className="artwork-info">
        <div>
          <h2>{work.title}</h2>
          <p>
            {mediumLabel(work.medium, locale)} <span>·</span> {work.width} × {work.height}{' '}
            {text(locale, 'см', 'cm')}
          </p>
          <span className={`availability ${work.availability === 'available' ? 'available' : ''}`}>
            <i aria-hidden="true" />
            {availabilityLabel(work.availability, locale)}
          </span>
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
  )
}
