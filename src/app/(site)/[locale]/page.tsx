import { CanvasImage } from '@/components/canvas-image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { artworkImage, getArtworks } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const works = await getArtworks(locale)
  const preview = works.slice(0, 3)
  const hasDemo = preview.some((work) => work.demo)
  return (
    <main id="main" className="showcase-main">
      <h1 className="sr-only">{text(locale, 'Картины', 'Paintings')}</h1>
      <div className="showcase-grid" data-count={preview.length}>
        {preview.map((work) => (
          <Link
            key={work.id}
            href={`/${locale}/works/${work.slug}`}
            className="showcase-work"
            aria-label={text(locale, `Посмотреть картину «${work.title}»`, `View “${work.title}”`)}
          >
            <CanvasImage
              src={artworkImage(work)}
              alt={String(work.title)}
              width={work.width}
              height={work.height}
              priority
              sizes="(max-width: 900px) 94vw, 33vw"
            />
          </Link>
        ))}
      </div>
      {preview.length > 0 ? (
        <div className="showcase-navigation">
          <Link href={`/${locale}/works`} className="showcase-more">
            {text(
              locale,
              works.length > preview.length ? 'Больше работ' : 'Открыть каталог',
              works.length > preview.length ? 'More paintings' : 'Explore the collection',
            )}
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <p className="muted">{text(locale, 'Работы скоро появятся', 'New works coming soon')}</p>
      )}
      {hasDemo && (
        <p className="showcase-demo">
          {text(locale, 'Демонстрационные изображения', 'Demonstration images')}
        </p>
      )}
    </main>
  )
}
