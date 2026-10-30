import { notFound } from 'next/navigation'
import { isLocale, text } from '@/lib/i18n'
export const metadata = { title: 'Конфиденциальность / Privacy' }
export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return (
    <main id="main" className="container page-main prose">
      <p className="eyebrow">{text(locale, 'ЛОКАЛЬНАЯ ПРЕДВАРИТЕЛЬНАЯ ВЕРСИЯ', 'LOCAL PREVIEW')}</p>
      <h1>{text(locale, 'Конфиденциальность', 'Privacy')}</h1>
      <p>
        {text(
          locale,
          'Это локальная тестовая версия сайта. Не отправляйте реальные персональные данные или конфиденциальные фотографии во время знакомства с интерфейсом.',
          'This is a local test version. Please use fictional contact details and non-sensitive images while exploring.',
        )}
      </p>
      <p>
        {text(
          locale,
          'При отправке формы выбранный контакт, текст, параметры заказа и вложения сохраняются в локальной базе проекта. Заявки и референсы доступны только через авторизованную админку. Внешние сообщения не отправляются.',
          'Submitting a form stores your contact, message, choices and attachments in the project’s local database. Requests and reference images are only accessible to authenticated administrators. No external message is sent.',
        )}
      </p>
      <p>
        {text(
          locale,
          'Перед публичным запуском здесь появится согласованная политика: кто обрабатывает данные, для чего, на какой срок и как запросить удаление. Эта страница описывает тестовый режим и не является готовой политикой для реальных продаж.',
          'Before a public launch, this page will be replaced with the agreed policy identifying the operator, purposes, retention periods and deletion process. This page describes the test environment and is not a production sales policy.',
        )}
      </p>
    </main>
  )
}
