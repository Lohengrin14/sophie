import Link from 'next/link'
import { CanvasImage } from '@/components/canvas-image'
import type { CatalogItem } from '@/lib/catalog-item'
import { type Locale, text } from '@/lib/i18n'
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
    <Link
      href={`/${locale}/works/${work.slug}`}
      className="artwork-card"
      aria-label={text(locale, `Посмотреть картину «${work.title}»`, `View “${work.title}”`)}
    >
      <CanvasImage
        className="artwork-image"
        src={work.image}
        alt={work.title}
        width={work.width}
        height={work.height}
        priority={priority}
        sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
      />
    </Link>
  )
}
