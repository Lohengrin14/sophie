import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, MoveDown } from 'lucide-react'
import { getArtworks, getStudio, artworkImage } from '@/lib/data'
import { isLocale, text, mediumLabel } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { ArtworkCard } from '@/components/artwork-card'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [works, studio] = await Promise.all([getArtworks(locale), getStudio(locale)])
  const hero = works.find((w) => w.featured) || works[0]
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="small-line" />
            {text(locale, 'ОРИГИНАЛЬНАЯ ЖИВОПИСЬ', 'ORIGINAL PAINTINGS')}
          </div>
          <h1>
            {text(locale, 'Искусство,', 'Art to live')}
            <br />
            <em>{text(locale, 'с которым', 'with, and')}</em>
            <br />
            {text(locale, 'хочется жить.', 'to feel.')}
          </h1>
          <p className="hero-description">
            {text(
              locale,
              'Картины для ваших пространств и историй. Найдите ту самую — или давайте создадим её вместе.',
              'Paintings for your spaces and your stories. Find the one that feels like you — or let’s create it together.',
            )}
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href={`/${locale}/works`}>
              {text(locale, 'Найти свою картину', 'Find your painting')} <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href={`/${locale}/commission`}>
              {text(locale, 'Обсудить заказ', 'Create something personal')} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="status-dot" />
            {text(
              locale,
              studio.commissionsOpen ? 'Открыта для ваших идей' : 'Новые заказы пока закрыты',
              studio.commissionsOpen ? 'Open to your ideas' : 'Commissions are currently closed',
            )}
            <span className="hero-footnote-divider" />{' '}
            {text(locale, 'Без спешки. С вниманием.', 'Unhurried. Thoughtful.')}
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art-stage">
            {hero ? (
              <Link href={`/${locale}/works/${hero.slug}`} className="hero-painting">
                <Image
                  src={artworkImage(hero)}
                  alt={String(hero.title)}
                  fill
                  priority
                  sizes="(max-width: 800px) 90vw, 52vw"
                />
              </Link>
            ) : (
              <div className="hero-empty">
                {text(locale, 'Здесь скоро появятся работы', 'New works are coming soon')}
              </div>
            )}
            <span className="vertical-caption">
              {text(locale, 'МГНОВЕНИЯ, КОТОРЫЕ ОСТАЮТСЯ', 'MOMENTS THAT STAY')}
            </span>
          </div>
          {hero && (
            <div className="hero-art-caption">
              <span>
                <span className="caption-index">01 /</span> {String(hero.title)}
              </span>
              <span>
                {mediumLabel(String(hero.medium), locale)} · {hero.width} × {hero.height}{' '}
                {text(locale, 'см', 'cm')}
              </span>
            </div>
          )}
          {studio.brand.demo && (
            <div className="hero-demo">
              {text(
                locale,
                'Демонстрационная коллекция · изображения созданы ИИ',
                'Demo collection · AI-generated artworks',
              )}
            </div>
          )}
        </div>
      </section>
      <div className="intro-line container">
        <span>{text(locale, 'ВЫБИРАЙТЕ СЕРДЦЕМ', 'CHOOSE WHAT MOVES YOU')}</span>
        <MoveDown size={19} />
        <span>
          {text(locale, 'ОБ ОСТАЛЬНОМ ПОЗАБОТИМСЯ ВМЕСТЕ', 'WE’LL FIGURE OUT THE REST TOGETHER')}
        </span>
      </div>
      <section className="section container" id="collection">
        <div className="section-top">
          <div>
            <p className="eyebrow">{text(locale, 'НЕБОЛЬШАЯ КОЛЛЕКЦИЯ', 'A SMALL COLLECTION')}</p>
            <h2>
              {text(locale, 'Каждая —', 'Each one,')}{' '}
              <em>{text(locale, 'единственная.', 'one of a kind.')}</em>
            </h2>
          </div>
          <Link className="text-link" href={`/${locale}/works`}>
            {text(locale, 'Все работы', 'Explore all works')} <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="artwork-grid">
          {works.slice(0, 3).map((work, i) => (
            <ArtworkCard key={work.id} work={work} locale={locale} index={i} />
          ))}
        </div>
        {!works.length && (
          <p className="muted">
            {text(
              locale,
              'Коллекция ещё наполняется. Загляните чуть позже.',
              'The collection is taking shape. Come back soon.',
            )}
          </p>
        )}
      </section>
      <section className="commission-feature">
        <div className="container commission-feature-inner">
          <div className="commission-visual">
            <Image
              src="/art/pears.png"
              alt={text(
                locale,
                'Демонстрационный натюрморт с грушами',
                'AI-generated example still life with pears',
              )}
              fill
              sizes="(max-width: 800px) 80vw, 35vw"
            />
            <div className="handwritten">
              {text(locale, 'начинается с вашей идеи', 'it begins with your idea')}
            </div>
          </div>
          <div className="commission-copy">
            <p className="eyebrow">
              {text(locale, 'ВАША ИСТОРИЯ НА ХОЛСТЕ', 'YOUR STORY, ON CANVAS')}
            </p>
            <h2>
              {text(locale, 'А если картина', 'What if the painting')}
              <br />
              <em>{text(locale, 'пока только в мыслях?', 'is still just a feeling?')}</em>
            </h2>
            <p>
              {text(
                locale,
                'Любимый человек, памятное место или просто ощущение. Расскажите, что вам близко, — вместе найдём форму, цвет и настроение.',
                'A favourite person, a meaningful place, or simply a feeling. Tell us what matters to you — we’ll find its shape, colour and mood together.',
              )}
            </p>
            <div className="mini-steps">
              {[
                [
                  text(locale, 'Ваша идея', 'Your idea'),
                  text(locale, 'Размер, сюжет, настроение', 'Size, subject, mood'),
                ],
                [
                  text(locale, 'Понятный ориентир', 'A clear starting point'),
                  text(locale, 'Примерная цена и срок', 'An estimated price and timeline'),
                ],
                [
                  text(locale, 'Личный разговор', 'A personal conversation'),
                  text(locale, 'Согласуем всё без спешки', 'We’ll work out the details together'),
                ],
              ].map(([title, desc], i) => (
                <div key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="button primary" href={`/${locale}/commission`}>
              {text(locale, 'Начать с идеи', 'Start with an idea')} <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="closing container">
        <p className="eyebrow">
          {text(locale, 'ПРОСТО ЧЕЛОВЕК ЧЕЛОВЕКУ', 'FROM ONE PERSON TO ANOTHER')}
        </p>
        <h2>
          {text(locale, 'Можно начать', 'It can start')}
          <br />
          <em>{text(locale, 'с простого «здравствуйте».', 'with a simple hello.')}</em>
        </h2>
        <p>
          {text(
            locale,
            'Не нужно знать всё о живописи или заранее выбирать размер. Вопросы — хорошее начало.',
            'You don’t need to know about art or have every detail figured out. Questions are a lovely place to start.',
          )}
        </p>
        <Link className="text-link" href={`/${locale}/contact`}>
          {text(locale, 'Давайте познакомимся', 'Let’s get to know each other')}{' '}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </main>
  )
}
