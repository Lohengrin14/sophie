import { MosaicGallery } from '@/components/mosaic-gallery'
import { notFound } from 'next/navigation'
import { getArtworks } from '@/lib/data'
import { toCardItem } from '@/lib/artwork-card-data'
import { isLocale, text } from '@/lib/i18n'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  return (
    <main id="main" className="mosaic-main">
      <h1 className="sr-only">{text(locale, 'Картины', 'Paintings')}</h1>
      <MosaicGallery works={works.map(toCardItem)} locale={locale} />
      {works.length === 0 && (
        <p className="muted">{text(locale, 'Работы скоро появятся', 'New works coming soon')}</p>
      )}
    </main>
  )
}
