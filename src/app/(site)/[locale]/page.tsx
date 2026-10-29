import { notFound } from 'next/navigation'
import { getArtworks } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { ArtworkCard } from '@/components/artwork-card'
import { toCardItem } from '@/lib/artwork-card-data'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  return (
    <main id="main" className="container gallery-main">
      <h1 className="sr-only">{text(locale, 'Картины', 'Paintings')}</h1>
      <div className="artwork-grid">
        {works.map((work, index) => (
          <ArtworkCard key={work.id} work={toCardItem(work)} locale={locale} priority={index < 3} />
        ))}
      </div>
      {works.length === 0 && (
        <p className="muted">{text(locale, 'Работы скоро появятся', 'New works coming soon')}</p>
      )}
    </main>
  )
}
