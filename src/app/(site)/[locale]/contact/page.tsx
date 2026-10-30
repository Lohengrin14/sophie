import { notFound, redirect } from 'next/navigation'
import { isLocale } from '@/lib/i18n'

// Keep existing shared links working after merging contacts into the artist page.
export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  redirect(`/${locale}/about#contacts`)
}
