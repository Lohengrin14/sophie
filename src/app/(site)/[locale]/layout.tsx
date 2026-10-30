import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { cookies } from 'next/headers'
import { THEME_COOKIE, resolveTheme, themeVariables } from '@/lib/site-themes'
import { notFound } from 'next/navigation'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/lora/400.css'
import '@fontsource/lora/400-italic.css'
import '@/styles/site.css'
import '@/styles/site-themes.css'
import '@/styles/artist-site.css'
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
      'Картины, работы на заказ и контакты художника.',
      'Paintings, commissions and artist contact details.',
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
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value)
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      data-site-theme={theme.id}
      style={themeVariables(theme) as CSSProperties}
    >
      <body>
        <a className="skip-link" href="#main">
          {text(locale, 'Перейти к содержимому', 'Skip to content')}
        </a>
        <Header locale={locale} brand={brand} initialTheme={theme.id} />
        {children}
        <Footer locale={locale} brand={brand} />
      </body>
    </html>
  )
}
