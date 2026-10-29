import 'server-only'
import { artworkImage, type Artwork } from '@/lib/data'
import type { CatalogItem } from '@/lib/catalog-item'
export function toCardItem(work: Artwork): CatalogItem {
  return {
    id: work.id,
    slug: String(work.slug),
    title: String(work.title),
    image: artworkImage(work),
    width: Number(work.width),
    height: Number(work.height),
    priceMinor: Number(work.priceMinor),
    currency: String(work.currency),
    medium: String(work.medium),
    availability: String(work.availability),
    demo: Boolean(work.demo),
  }
}
