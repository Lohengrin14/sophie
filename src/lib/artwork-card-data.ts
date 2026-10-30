import 'server-only'
import { artworkImage, type Artwork } from '@/lib/data'
import type { CatalogItem } from '@/lib/catalog-item'
export function toCardItem(work: Artwork): CatalogItem {
  return {
    id: work.id,
    slug: String(work.slug),
    title: String(work.title),
    image: artworkImage(work),
    images: [
      ...new Set(
        [work.image, ...(work.images || [])].flatMap((image) =>
          image && typeof image === 'object' && image.url ? [image.url] : [],
        ),
      ),
    ],
    width: Number(work.width),
    height: Number(work.height),
    medium: String(work.medium),
    availability: String(work.availability),
    demo: Boolean(work.demo),
    displaySize: work.displaySize,
  }
}
