import { notFound } from 'next/navigation'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
import { ContactLinks } from '@/components/footer'
export const metadata = { title: 'Контакты / Contact' }
export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const { brand } = await getStudio(locale)
  return (
    <main id="main" className="container page-main contact-page">
      <h1>{text(locale, 'Написать мне', 'Say hello')}</h1>
      <ContactLinks brand={brand} />
      {!brand.telegram && !brand.instagram && !brand.email && (
        <p className="muted">
          {text(locale, 'Контакты скоро появятся.', 'Contact details coming soon.')}
        </p>
      )}
    </main>
  )
}
