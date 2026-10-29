import { notFound } from 'next/navigation'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { ContactLinks } from '@/components/footer'
import { RequestForm } from '@/components/request-form'
export const metadata = { title: 'Связаться / Contact' }
export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const { brand } = await getStudio(locale)
  return (
    <main id="main" className="container page-main">
      <div className="commission-page">
        <div className="commission-intro">
          <p className="eyebrow">{text(locale, 'ПРОСТО НАПИШИТЕ', 'SAY HELLO')}</p>
          <h1>
            {text(locale, 'Хорошие истории', 'Good stories')}
            <br />
            <em>{text(locale, 'начинаются так.', 'begin like this.')}</em>
          </h1>
          <p className="lead">
            {text(
              locale,
              'Вопрос о картине, неожиданная идея или просто желание познакомиться — всему рады.',
              'A question about a painting, an unexpected idea, or just a wish to say hello — all are welcome.',
            )}
          </p>
          <ContactLinks brand={brand} />
        </div>
        <div className="form-shell">
          <RequestForm locale={locale} brand={brand} kind="question" />
        </div>
      </div>
    </main>
  )
}
