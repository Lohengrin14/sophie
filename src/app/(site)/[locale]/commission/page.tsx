import { notFound } from 'next/navigation'
import { ArrowDownRight, Sparkles } from 'lucide-react'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
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
          <p className="eyebrow">{text(locale, 'НЕЧТО ЛИЧНОЕ', 'SOMETHING PERSONAL')}</p>
          <h1>
            {text(locale, 'Ваша идея.', 'Your idea.')}
            <br />
            <em>{text(locale, 'Ваша картина.', 'Your painting.')}</em>
          </h1>
          <p className="lead">
            {text(
              locale,
              'Иногда самой важной картине ещё только предстоит появиться.',
              'Sometimes the most meaningful painting is the one yet to be made.',
            )}
          </p>
          <p className="muted">
            {text(
              locale,
              'Выберите несколько деталей, посмотрите ориентир и расскажите о себе. Дальше — спокойный разговор с художником.',
              'Choose a few details, see an estimate, and introduce yourself. Then we’ll take it from there, together.',
            )}
          </p>
          <div className="commission-promise">
            <Sparkles size={20} strokeWidth={1.2} />
            <span>
              {text(
                locale,
                'Не знаете, с чего начать? Выберите «Помогите выбрать» — это тоже хороший план.',
                'Not sure where to begin? Choose “Help me choose” — that’s a good plan too.',
              )}
            </span>
          </div>
          <ArrowDownRight className="intro-arrow" size={82} strokeWidth={0.8} />
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
        <p className="eyebrow">{text(locale, 'ЧТО СТОИТ ЗНАТЬ', 'A FEW THINGS TO KNOW')}</p>
        <h2>
          {text(locale, 'Без лишних', 'No unanswered')}{' '}
          <em>{text(locale, 'неизвестных.', 'questions.')}</em>
        </h2>
        {[
          [
            text(locale, 'Цена окончательная?', 'Is the price final?'),
            text(
              locale,
              'Пока это ориентир. Количество деталей, сложность сюжета и пожелания могут повлиять на стоимость. Итог согласуем до начала работы.',
              'It’s a starting estimate. Detail, complexity and your wishes may affect the price. We’ll agree on it before any work begins.',
            ),
          ],
          [
            text(locale, 'Почему картина требует времени?', 'Why does it take time?'),
            text(
              locale,
              'Помимо самой живописи, маслу нужна просушка. Ориентир включает время до готовности, но не доставку. Нужную вам дату обсудим отдельно.',
              'Oil painting needs drying time as well as painting time. The estimate covers readiness, not shipping. We’ll discuss any important dates personally.',
            ),
          ],
          [
            text(locale, 'Можно заказать в другую страну?', 'Can I order from another country?'),
            text(
              locale,
              'Укажите страну и город в пожеланиях. Возможность, способ и стоимость доставки обсуждаются отдельно до подтверждения заказа.',
              'Mention your country and city in your notes. Availability, method and cost of shipping are discussed before confirming the order.',
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
