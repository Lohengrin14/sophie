import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { WorkImages } from '@/components/work-images'
import type { Media } from '@/payload-types'
import { getArtworkBySlug, getStudio, artworkImage } from '@/lib/data'
import { availabilityLabel, isLocale, mediumLabel, money, text } from '@/lib/i18n'
import { BuyLink } from '@/components/purchase-link'
import { artworkPrice } from '@/lib/artwork-prices'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const work = await getArtworkBySlug(locale, slug)
  return work
    ? {
        title: String(work.title),
        description: work.description || undefined,
        openGraph: { title: String(work.title), images: [artworkImage(work)] },
      }
    : {}
}
export default async function Work({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [work, studio] = await Promise.all([getArtworkBySlug(locale, slug), getStudio(locale)])
  if (!work) notFound()
  const price = artworkPrice(work, locale)
  const media = [work.image, ...(work.images || [])].filter((image): image is Media =>
    Boolean(image && typeof image === 'object' && image.url),
  )
  const images = [
    ...new Map(media.map((image) => [image.id, { id: image.id, url: String(image.url) }])).values(),
  ]
  return (
    <main id="main" className="container page-main work-page">
      <Link className="back-link" href={`/${locale}#work-${work.id}`}>
        <ArrowLeft size={16} />
        {text(locale, 'К коллекции', 'Back to the collection')}
      </Link>
      <div className="work-detail">
        <div>
          <WorkImages
            key={work.id}
            images={images}
            title={String(work.title || '')}
            locale={locale}
          />
        </div>
        <div className="work-description">
          <h1>{String(work.title)}</h1>
          <span
            className={`availability inline ${work.availability === 'available' ? 'available' : ''}`}
          >
            <i />
            {availabilityLabel(String(work.availability), locale)}
          </span>
          {work.description?.trim() && <p className="work-story">{work.description.trim()}</p>}
          <dl className="work-specs">
            <div>
              <dt>{text(locale, 'Материал', 'Medium')}</dt>
              <dd>{mediumLabel(String(work.medium), locale)}</dd>
            </div>
            <div>
              <dt>{text(locale, 'Размер', 'Dimensions')}</dt>
              <dd>
                {work.width} × {work.height} {text(locale, 'см', 'cm')}
              </dd>
            </div>
            <div>
              <dt>{text(locale, 'Год', 'Year')}</dt>
              <dd>{work.year}</dd>
            </div>
          </dl>
          {price && (
            <div className="detail-price">{money(price.priceMinor, price.currency, locale)}</div>
          )}
          {work.availability === 'available' ? (
            <BuyLink
              brand={studio.brand}
              locale={locale}
              title={String(work.title)}
              path={`/${locale}/works/${work.slug}`}
            />
          ) : (
            <Link className="button primary full" href={`/${locale}/commission`}>
              {text(locale, 'Картина на заказ', 'Commission a painting')} <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
