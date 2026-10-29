import { notFound } from 'next/navigation'
import { getArtworks } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { Catalog } from '@/components/catalog'
import { toCardItem } from '@/lib/artwork-card-data'
export const metadata = { title: 'Коллекция / Collection' }
export default async function Works({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  return (
    <main id="main" className="container gallery-main">
      <div className="gallery-bar">
        <h1>{text(locale, 'Все картины', 'All paintings')}</h1>
      </div>
      <Catalog locale={locale} works={works.map(toCardItem)} />
    </main>
  )
}
