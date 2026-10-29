import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getArtworks } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { Catalog } from '@/components/catalog'
import { toCardItem } from '@/lib/artwork-card-data'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  return (
    <main id="main" className="container gallery-main">
      <div className="gallery-bar">
        <h1>{text(locale, 'Картины', 'Paintings')}</h1>
        <Link href={`/${locale}/commission`} className="gallery-order-link">
          {text(locale, 'Картина на заказ', 'Commission a painting')}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <Catalog works={works.map(toCardItem)} locale={locale} />
    </main>
  )
}
