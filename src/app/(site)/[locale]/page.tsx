import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, ArrowUpRight, Asterisk } from 'lucide-react'
import { getArtworks, getStudio, artworkImage } from '@/lib/data'
import { isLocale, text, mediumLabel, money, availabilityLabel } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { ArtworkCard } from '@/components/artwork-card'
import { toCardItem } from '@/lib/artwork-card-data'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [works, studio] = await Promise.all([getArtworks(locale), getStudio(locale)])
  const hero = works.find((w) => w.featured) || works[0]
  const selected = works.filter((w) => w.id !== hero?.id).slice(0, 4)
  const companion = selected[0]
  return (
    <main id="main">
      <section className="gallery-intro container">
        <div className="gallery-kicker">
          <span>
            {text(locale, 'Живопись / Личная коллекция', 'Paintings / A personal collection')}
          </span>
          <span className="studio-status">
            <i className={studio.commissionsOpen ? 'status-dot' : ''} />
            {text(
              locale,
              studio.commissionsOpen ? 'Принимаю заказы' : 'Заказы пока закрыты',
              studio.commissionsOpen ? 'Open for commissions' : 'Commissions closed',
            )}
          </span>
        </div>
        <h1>
          {text(locale, 'Искусство рядом.', 'Art, a little closer.')}
          <Asterisk aria-hidden="true" />
        </h1>
        <div className="gallery-intro-bottom">
          <p>
            {text(
              locale,
              'Оригинальные картины. В вашу жизнь, в ваш дом.',
              'Original paintings. For your space, for your everyday.',
            )}
          </p>
          <Link href={`/${locale}/works`} className="text-link">
            {text(locale, 'Смотреть работы', 'Explore the works')}
            <ArrowDown size={18} />
          </Link>
        </div>
        {hero ? (
          <div className="exhibition">
            <div className="exhibition-main">
              <Link href={`/${locale}/works/${hero.slug}`} className="exhibition-canvas">
                <Image
                  src={artworkImage(hero)}
                  alt={String(hero.title)}
                  fill
                  priority
                  sizes="(max-width: 700px) 92vw, 62vw"
                />
                <span className="exhibition-open">
                  <ArrowUpRight size={28} />
                  <span className="sr-only">
                    {text(locale, 'Открыть картину', 'View painting')}
                  </span>
                </span>
              </Link>
              <div className="exhibition-caption">
                <span>
                  <small>01 /</small> {String(hero.title)}
                </span>
                <span>
                  {hero.availability === 'sold'
                    ? availabilityLabel('sold', locale)
                    : money(Number(hero.priceMinor), String(hero.currency), locale)}
                </span>
              </div>
              {hero.demo && (
                <p className="demo-caption">
                  {text(
                    locale,
                    'Демо · изображение создано ИИ, цена для примера',
                    'Demo · AI-generated image, illustrative price',
                  )}
                </p>
              )}
            </div>
            <div className="exhibition-side">
              <div className="gallery-note">
                <span className="eyebrow">{text(locale, 'ИЗ МАСТЕРСКОЙ', 'FROM THE STUDIO')}</span>
                <p>
                  {text(
                    locale,
                    'Цвет. Свет.\nЧто-то личное.',
                    'Colour. Light.\nSomething personal.',
                  )}
                </p>
                <Link className="text-link" href={`/${locale}/about`}>
                  {text(locale, 'О художнике', 'Meet the artist')}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              {companion && (
                <Link href={`/${locale}/works/${companion.slug}`} className="exhibition-companion">
                  <div>
                    <Image
                      src={artworkImage(companion)}
                      alt={String(companion.title)}
                      fill
                      sizes="(max-width: 700px) 40vw, 28vw"
                    />
                  </div>
                  <span>
                    {String(companion.title)}
                    <ArrowUpRight size={17} />
                  </span>
                  {companion.demo && (
                    <small className="demo-caption">
                      {text(locale, 'Демо · создано ИИ', 'Demo · AI-generated')}
                    </small>
                  )}
                </Link>
              )}
              <span className="exhibition-material">
                {mediumLabel(String(hero.medium), locale)} / {hero.width} × {hero.height}{' '}
                {text(locale, 'см', 'cm')}
              </span>
            </div>
          </div>
        ) : (
          <div className="gallery-empty">
            {text(
              locale,
              'Новая коллекция скоро появится здесь.',
              'A new collection is coming soon.',
            )}
          </div>
        )}
      </section>
      {selected.length > 0 && (
        <section className="collection-section container" id="collection">
          <div className="collection-heading">
            <h2>{text(locale, 'Ещё в коллекции', 'In the collection')}</h2>
            <Link className="text-link" href={`/${locale}/works`}>
              {text(locale, 'Все работы', 'All works')}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="artwork-grid home-collection">
            {selected.map((work, i) => (
              <ArtworkCard key={work.id} work={toCardItem(work)} locale={locale} index={i} />
            ))}
          </div>
        </section>
      )}
      <section className="commission-strip">
        <div className="container">
          <span className="eyebrow">
            {text(locale, '01 ИДЕЯ → 01 КАРТИНА', '01 IDEA → 01 PAINTING')}
          </span>
          <Link href={`/${locale}/commission`}>
            <h2>{text(locale, 'А что близко вам?', 'What moves you?')}</h2>
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <p>
            {text(
              locale,
              'Расскажите свою идею. Начнём с цены и сроков.',
              'Tell me your idea. We’ll start with a price and a timeline.',
            )}
          </p>
        </div>
      </section>
    </main>
  )
}
