import 'server-only'
import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import { type Locale } from './i18n'
import { resolveBrand } from './brand'

export const cms = () => getPayload({ config })
export const getStudio = cache(async (locale: Locale) => {
  const payload = await cms()
  const studio = await payload.findGlobal({ slug: 'studio', locale, overrideAccess: false })
  return { ...studio, brand: resolveBrand(studio as unknown as Record<string, unknown>) }
})
export const getArtworks = cache(async (locale: Locale) => {
  const payload = await cms()
  const result = await payload.find({
    collection: 'artworks',
    locale,
    overrideAccess: false,
    depth: 1,
    sort: ['sortOrder', '-displaySize', 'title', 'id'],
    limit: 100,
    where: { and: [{ title: { exists: true } }, { title: { not_equals: '' } }] },
  })
  return result.docs
})
export type Artwork = Awaited<ReturnType<typeof getArtworks>>[number]
export function artworkImage(work: Artwork) {
  const image = work.image
  return image && typeof image === 'object' && 'url' in image ? String(image.url || '') : ''
}

export const getArtworkBySlug = cache(async (locale: Locale, slug: string) => {
  const payload = await cms()
  const result = await payload.find({
    collection: 'artworks',
    locale,
    overrideAccess: false,
    depth: 1,
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { title: { exists: true } }, { title: { not_equals: '' } }],
    },
  })
  return result.docs[0] || null
})
