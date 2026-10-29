import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { artworkImage, type Artwork } from '@/lib/data'
import { availabilityLabel, mediumLabel, money, type Locale, text } from '@/lib/i18n'
export function ArtworkCard({
  work,
  locale,
  index = 0,
}: {
  work: Artwork
  locale: Locale
  index?: number
}) {
  return (
    <Link href={`/${locale}/works/${work.slug}`} className="artwork-card">
      <div className={`artwork-image artwork-image-${index % 3}`}>
        {artworkImage(work) && (
          <Image
            src={artworkImage(work)}
            alt={String(work.title)}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
          />
        )}
        <span className={`availability ${work.availability === 'available' ? 'available' : ''}`}>
          <i />
          {availabilityLabel(String(work.availability), locale)}
        </span>
        <span className="card-open">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="artwork-info">
        <div>
          <h3>{String(work.title)}</h3>
          <p>
            {mediumLabel(String(work.medium), locale)} <span>·</span> {work.width} × {work.height}{' '}
            {text(locale, 'см', 'cm')}
          </p>
        </div>
        <span className="artwork-price">
          {work.availability === 'sold'
            ? text(locale, 'Продана', 'Sold')
            : money(Number(work.priceMinor), String(work.currency), locale)}
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
