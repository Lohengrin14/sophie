import { notFound } from 'next/navigation'
import { getArtworks, artworkImage } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { Catalog } from '@/components/catalog'
export const metadata = { title: 'Коллекция / Collection' }
export default async function Works({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  return (
    <main id="main" className="container page-main">
      <header className="page-heading">
        <p className="eyebrow">
          {text(locale, 'ВЫБИРАЙТЕ ТО, ЧТО ОТКЛИКАЕТСЯ', 'FIND WHAT RESONATES')}
        </p>
        <h1>
          {text(locale, 'Работы, которые', 'Paintings that')}
          <br />
          <em>{text(locale, 'ищут свой дом.', 'feel like home.')}</em>
        </h1>
        <p>
          {text(
            locale,
            'У каждой картины свой характер. Возможно, здесь вы встретите близкий вам.',
            'Every painting has its own character. Perhaps you’ll find a little of yourself here.',
          )}
        </p>
      </header>
      <Catalog
        locale={locale}
        works={works.map((w) => ({
          id: w.id,
          slug: String(w.slug),
          title: String(w.title),
          image: artworkImage(w),
          width: Number(w.width),
          height: Number(w.height),
          priceMinor: Number(w.priceMinor),
          currency: String(w.currency),
          medium: String(w.medium),
          availability: String(w.availability),
          demo: Boolean(w.demo),
        }))}
      />
    </main>
  )
}
