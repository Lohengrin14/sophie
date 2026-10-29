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
      <div className="footer-top">
        <div>
          <Link className="footer-brand" href={`/${locale}`}>
            {brand.alias || brand.name || 'ATELIER'}.
          </Link>
          <p>
            {text(
              locale,
              'Искусство становится частью вашей истории.',
              'Art becomes part of your story.',
            )}
          </p>
        </div>
        <ContactLinks brand={brand} />
        <Link className="text-link" href={`/${locale}/contact`}>
          {text(locale, 'Начнём с разговора', 'Let’s start a conversation')}{' '}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="footer-bottom">
        <span>© 2026 {brand.name || brand.alias || 'Artist Studio'}</span>
        {brand.demo && (
          <span>
            {text(
              locale,
              'Демонстрационная коллекция · изображения созданы ИИ',
              'Demo collection · AI-generated images',
            )}
          </span>
        )}
        <Link href={`/${locale}/privacy`}>{text(locale, 'Конфиденциальность', 'Privacy')}</Link>
      </div>
    </footer>
  )
}
