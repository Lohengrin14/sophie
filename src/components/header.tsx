'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import type { Brand } from '@/lib/brand'

export function Header({ locale, brand }: { locale: Locale; brand: Brand }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const other = locale === 'ru' ? 'en' : 'ru'
  const alternate = pathname.replace(/^\/(ru|en)(?=\/|$)/, `/${other}`)
  const links = [
    ['works', text(locale, 'Работы', 'Works')],
    ['commission', text(locale, 'На заказ', 'Commissions')],
    ['about', text(locale, 'О художнике', 'About')],
    ['contact', text(locale, 'Контакты', 'Contact')],
  ]
  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link
          href={`/${locale}`}
          className="wordmark"
          aria-label={text(locale, 'На главную', 'Home')}
          onClick={() => setOpen(false)}
        >
          <span>
            {brand.alias || brand.name || 'ATELIER'}
            <span className="wordmark-dot">.</span>
          </span>
        </Link>
        <nav
          id="main-navigation"
          aria-label={text(locale, 'Основное меню', 'Main navigation')}
          className={`main-nav ${open ? 'is-open' : ''}`}
        >
          {links.map(([path, label]) => (
            <Link
              key={path}
              href={`/${locale}/${path}`}
              onClick={() => setOpen(false)}
              className={
                pathname.includes(`/${path}`) || (path === 'works' && pathname === `/${locale}`)
                  ? 'active'
                  : ''
              }
              aria-current={
                pathname === `/${locale}/${path}` || (path === 'works' && pathname === `/${locale}`)
                  ? 'page'
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="language"
            href={alternate}
            onClick={() => setOpen(false)}
            aria-label={other === 'en' ? 'Switch to English' : 'Переключить на русский'}
          >
            <span className={locale === 'ru' ? 'current' : ''}>RU</span>
            <span className="language-divider">/</span>
            <span className={locale === 'en' ? 'current' : ''}>EN</span>
          </Link>
          <button
            className="menu-button"
            aria-label={text(locale, 'Меню', 'Menu')}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
