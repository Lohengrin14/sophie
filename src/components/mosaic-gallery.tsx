import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { mosaicLayout } from '@/lib/mosaic-layout'
import { canvasSize } from '@/lib/canvas-size'
import { text, type Locale } from '@/lib/i18n'
import type { CatalogItem } from '@/lib/catalog-item'

export function MosaicGallery({ works, locale }: { works: CatalogItem[]; locale: Locale }) {
  const desktop = mosaicLayout(works, 24)
  const tablet = mosaicLayout(works, 16)
  const mobile = mosaicLayout(works, 12)
  return (
    <div className="mosaic-grid">
      {works.map((work, index) => {
        const style = Object.fromEntries(
          Object.entries({
            wide: desktop[index],
            medium: tablet[index],
            small: mobile[index],
          }).flatMap(([name, position]) => {
            return [
              [`--${name}-column`, position.column],
              [`--${name}-row`, position.row],
              [`--${name}-width`, position.columns],
              [`--${name}-height`, position.rows],
            ]
          }),
        ) as CSSProperties
        return (
          <Link
            key={work.id}
            id={`work-${work.id}`}
            href={`/${locale}/works/${work.slug}`}
            className="mosaic-work"
            style={style}
            data-canvas-tier={canvasSize(work.width, work.height).tier}
            aria-label={text(locale, `Посмотреть картину «${work.title}»`, `View “${work.title}”`)}
          >
            <div className="mosaic-image">
              {work.image && (
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  priority={index < 3}
                  sizes="(max-width: 700px) 94vw, (max-width: 1100px) 62vw, 50vw"
                />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
