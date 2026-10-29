import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
export const metadata = { title: 'О художнике / About' }
export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const studio = await getStudio(locale)
  return (
    <main id="main" className="container page-main">
      <div className="about-layout">
        <div className="about-image">
          <Image
            src="/art/olive-grove.png"
            alt={text(
              locale,
              'Фрагмент демонстрационной живописи',
              'Detail of an AI-generated demonstration painting',
            )}
            fill
            sizes="(max-width: 800px) 90vw, 45vw"
          />
          <span>{text(locale, 'Свет. Цвет. Ощущение.', 'Light. Colour. A feeling.')}</span>
        </div>
        <div>
          <p className="eyebrow">
            {text(locale, 'ЗА КАЖДОЙ КАРТИНОЙ — ЧЕЛОВЕК', 'BEHIND EVERY PAINTING, A PERSON')}
          </p>
          <h1>
            {studio.brand.name || text(locale, 'Давайте', 'Let’s')}
            <br />
            <em>{studio.brand.alias || text(locale, 'знакомиться.', 'get acquainted.')}</em>
          </h1>
          <p className="lead">
            {text(locale, 'Искусство начинается с внимания.', 'Art begins with paying attention.')}
          </p>
          <p className="about-text">
            {String(
              studio.about ||
                text(
                  locale,
                  'Здесь появится история художника: что вдохновляет, как рождаются работы и почему одни моменты хочется сохранить на холсте. Пока это пространство для нашего будущего знакомства.',
                  'This is where the artist’s story will live: the inspiration, the process, and the moments worth keeping on canvas. For now, a little space for our future introduction.',
                ),
            )}
          </p>
          <Link className="text-link" href={`/${locale}/contact`}>
            {text(locale, 'Начать разговор', 'Start a conversation')} <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </main>
  )
}
