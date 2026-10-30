import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { WorkImages } from '@/components/work-images'
import type { Media } from '@/payload-types'
import { getArtworks, getStudio, artworkImage } from '@/lib/data'
import { availabilityLabel, isLocale, mediumLabel, money, text } from '@/lib/i18n'
import { RequestForm } from '@/components/request-form'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const work = (await getArtworks(locale)).find((w) => w.slug === slug)
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
  const [works, studio] = await Promise.all([getArtworks(locale), getStudio(locale)])
  const work = works.find((w) => w.slug === slug)
  if (!work) notFound()
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
          {work.demo && (
            <p className="demo-caption detail-demo">
              {text(
                locale,
                'Демонстрационное изображение. Характеристики и цена — пример.',
                'Demonstration image. Specifications and price are illustrative.',
              )}
            </p>
          )}
        </div>
        <div className="work-description">
          <p className="eyebrow">{text(locale, 'ОРИГИНАЛЬНАЯ ЖИВОПИСЬ', 'ORIGINAL PAINTING')}</p>
          <h1>{String(work.title)}</h1>
          <span
            className={`availability inline ${work.availability === 'available' ? 'available' : ''}`}
          >
            <i />
            {availabilityLabel(String(work.availability), locale)}
          </span>
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
          <div className="detail-price">
            {money(Number(work.priceMinor), String(work.currency), locale)}
          </div>
          <p className="muted small">
            {text(
              locale,
              'Доставку и оформление обсудим отдельно.',
              'Shipping and framing are discussed separately.',
            )}
          </p>
          {work.availability === 'available' ? (
            <a className="button primary full" href="#purchase">
              {text(locale, 'Мне откликается', 'This feels like me')} <ArrowUpRight size={17} />
            </a>
          ) : (
            <Link className="button primary full" href={`/${locale}/commission`}>
              {text(locale, 'Обсудить похожее настроение', 'Commission a similar mood')}{' '}
              <ArrowUpRight size={17} />
            </Link>
          )}
          <p className="private-note">
            <ShieldCheck size={14} />
            {text(
              locale,
              'Без оплаты на сайте. Сначала познакомимся.',
              'No online payment. Let’s talk first.',
            )}
          </p>
        </div>
      </div>
      {work.availability === 'available' && (
        <section id="purchase" className="purchase-section">
          <div>
            <p className="eyebrow">{text(locale, 'ПЕРВЫЙ ШАГ', 'THE FIRST STEP')}</p>
            <h2>
              {text(locale, 'Пусть эта история', 'Let this story')}
              <br />
              <em>{text(locale, 'станет вашей.', 'become yours.')}</em>
            </h2>
            <p className="muted">
              {text(
                locale,
                'Оставьте контакт. Наличие, доставку и детали покупки согласуем лично. Заявка не ставит картину в резерв автоматически.',
                'Leave a contact. We’ll confirm availability, shipping and purchase details personally. A request does not automatically reserve the painting.',
              )}
            </p>
          </div>
          <div className="form-shell">
            <RequestForm
              locale={locale}
              brand={studio.brand}
              kind="purchase"
              artworkId={Number(work.id)}
            />
          </div>
        </section>
      )}
    </main>
  )
}
