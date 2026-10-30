import { notFound, redirect } from 'next/navigation'
import { isLocale } from '@/lib/i18n'

// Preserve old collection links while keeping a single gallery.
export default async function Works({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  redirect(`/${locale}`)
}
