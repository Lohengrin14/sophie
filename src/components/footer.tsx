import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import type { Brand } from '@/lib/brand'
export function ContactLinks({ brand }: { brand: Brand }) {
  return (
    <div className="contact-links">
      {brand.instagram && (
        <a href={brand.instagram} target="_blank" rel="noreferrer">
          Instagram <ArrowUpRight size={15} />
        </a>
      )}
      {brand.telegram && (
        <a href={brand.telegram} target="_blank" rel="noreferrer">
          Telegram <ArrowUpRight size={15} />
        </a>
      )}
      {brand.email && (
        <a href={`mailto:${brand.email}`}>
          {brand.email} <ArrowUpRight size={15} />
        </a>
      )}
    </div>
  )
}
export function Footer({ locale, brand }: { locale: Locale; brand: Brand }) {
  return (
    <footer className="site-footer container">
      <span>
        © {new Date().getFullYear()} {brand.name || brand.alias || 'Artist Studio'}
      </span>
      <ContactLinks brand={brand} />
      <Link href={`/${locale}/privacy`}>{text(locale, 'Конфиденциальность', 'Privacy')}</Link>
    </footer>
  )
}
