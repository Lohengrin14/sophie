import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/lora/400.css'
import '@fontsource/lora/400-italic.css'
import '@/styles/site.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { brand } = await getStudio(locale)
  const name = brand.alias || brand.name || 'Artist Studio'
  return {
    metadataBase: new URL('http://127.0.0.1:3000'),
    title: { default: name, template: `%s · ${name}` },
    description: text(
      locale,
      'Оригинальные картины и живопись на заказ. Найдите свою картину.',
      'Original paintings and personal commissions. Find your painting.',
    ),
    robots: { index: false, follow: false },
  }
}
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const { brand } = await getStudio(locale)
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          {text(locale, 'Перейти к содержимому', 'Skip to content')}
        </a>
        <Header locale={locale} brand={brand} />
        {children}
        <Footer locale={locale} brand={brand} />
      </body>
    </html>
  )
}
