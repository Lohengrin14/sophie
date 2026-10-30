import { notFound } from 'next/navigation'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { ContactLinks } from '@/components/footer'
import { RequestForm } from '@/components/request-form'
export const metadata = { title: 'Картина на заказ / Commissions' }
export default async function Commission({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const studio = await getStudio(locale)
  return (
    <main id="main" className="container page-main">
      <div className="commission-page">
        <div className="commission-intro">
          <h1>{text(locale, 'Что нарисуем?', 'What shall I paint?')}</h1>
          <p className="muted">
            {text(locale, 'Начнём с сюжета и размера.', 'Start with a subject and size.')}
          </p>
          {(studio.brand.instagram || studio.brand.telegram || studio.brand.email) && (
            <div className="commission-direct">
              <p className="muted">
                {text(locale, 'Или напишите напрямую', 'Or message me directly')}
              </p>
              <ContactLinks brand={studio.brand} className="artist-contacts" />
            </div>
          )}
        </div>
        <div className="form-shell">
          <RequestForm
            locale={locale}
            brand={studio.brand}
            kind="commission"
            commissionsOpen={studio.commissionsOpen !== false}
          />
        </div>
      </div>
      <section className="faq-section">
        <h2>{text(locale, 'О заказе', 'Commission questions')}</h2>
        {[
          [
            text(locale, 'Цена окончательная?', 'Is the price final?'),
            text(
              locale,
              'Это примерная цена. Точную назову, когда обсудим сюжет и детали.',
              'It’s an estimate. I’ll confirm the price once we’ve discussed your idea.',
            ),
          ],
          [
            text(locale, 'Почему картина требует времени?', 'Why does it take time?'),
            text(
              locale,
              'Маслу нужно высохнуть. Этот срок уже включён в оценку, доставка — отдельно. Если картина нужна к дате, напишите об этом.',
              'Oils need time to dry. That’s included in the estimate; shipping is extra. Let me know if you have a date in mind.',
            ),
          ],
          [
            text(locale, 'Можно заказать в другую страну?', 'Can I order from another country?'),
            text(
              locale,
              'Напишите страну и город — проверю варианты и стоимость доставки до заказа.',
              'Tell me your country and city. I’ll check shipping options and costs before you order.',
            ),
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </main>
  )
}
