import { MosaicPreview } from './mosaic-preview'
import type { CSSProperties } from 'react'
import { mosaicLayout } from '@/lib/mosaic-layout'
import { type Locale } from '@/lib/i18n'
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
          <MosaicPreview
            key={work.id}
            work={work}
            locale={locale}
            style={style}
            priority={index < 3}
          />
        )
      })}
    </div>
  )
}
