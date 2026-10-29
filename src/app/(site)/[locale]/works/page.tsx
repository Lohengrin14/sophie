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
    <main id="main" className="container page-main">
      <header className="page-heading catalog-heading">
        <p className="eyebrow">{text(locale, 'ОРИГИНАЛЬНАЯ ЖИВОПИСЬ', 'ORIGINAL PAINTINGS')}</p>
        <h1>
          {text(locale, 'Коллекция', 'The collection')}
          <sup>({String(works.length).padStart(2, '0')})</sup>
        </h1>
        <p>
          {text(
            locale,
            'Выберите картину — детали обсудим лично.',
            'Find your painting. We’ll work out the details together.',
          )}
        </p>
      </header>
      <Catalog locale={locale} works={works.map(toCardItem)} />
    </main>
  )
}
