'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import { ThemePicker } from './theme-picker'
import { DEFAULT_THEME, type ThemeId } from '@/lib/site-themes'
import type { Brand } from '@/lib/brand'

export function Header({
  locale,
  brand,
  initialTheme = DEFAULT_THEME,
}: {
  locale: Locale
  brand: Brand
  initialTheme?: ThemeId
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const other = locale === 'ru' ? 'en' : 'ru'
  const alternate = pathname.replace(/^\/(ru|en)(?=\/|$)/, `/${other}`)
  const links = [
    ['', text(locale, 'картины', 'paintings')],
    ['commission', text(locale, 'на заказ', 'commissions')],
    ['about', text(locale, 'обо мне', 'about me')],
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
            <span className="artist-name">{brand.alias || brand.name || 'Artist'}</span>
          </span>
        </Link>
        <nav
          id="main-navigation"
          aria-label={text(locale, 'Основное меню', 'Main navigation')}
          className={`main-nav ${open ? 'is-open' : ''}`}
        >
          {links.map(([path, label]) => {
            const active = path
              ? pathname.startsWith(`/${locale}/${path}`)
              : pathname === `/${locale}` || pathname.startsWith(`/${locale}/works/`)
            return (
              <Link
                key={path}
                href={path ? `/${locale}/${path}` : `/${locale}`}
                onClick={() => setOpen(false)}
                className={active ? 'active' : ''}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-label">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="header-actions">
          <ThemePicker initialTheme={initialTheme} locale={locale} onOpen={() => setOpen(false)} />
          <Link
            className="language"
            href={alternate}
            onClick={() => setOpen(false)}
            aria-label={other === 'en' ? 'Switch to English' : 'Переключить на русский'}
          >
            <span>{other.toUpperCase()}</span>
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
