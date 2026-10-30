'use client'
import { useAdminText } from './studio-locale'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth, useTranslation } from '@payloadcms/ui'
import type { User } from '@/payload-types'
import { can, type Section } from '@/lib/studio-access'
import { ExternalLink, Palette, Settings2 } from 'lucide-react'

export function StudioNav() {
  return null
}
export function StudioHeader() {
  const t = useAdminText()

  const path = usePathname()
  const { user } = useAuth<User>()
  const { i18n, switchLanguage } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'ru'
  const query = useSearchParams()
  const tab =
    query.get('tab') ||
    (['gallery', 'artist', 'users', 'quotes', 'requests'] as Section[]).find((section) =>
      can(user, section),
    ) ||
    'gallery'
  const tabs = [
    ['artist', t('Художник'), '/admin?tab=artist'],
    ['users', t('Сотрудники'), '/admin?tab=users'],
    ['gallery', t('Галерея'), '/admin?tab=gallery'],
    ['quotes', t('Цены и сроки'), '/admin?tab=quotes'],
    ['requests', t('Заявки'), '/admin?tab=requests'],
  ]
  const active = path.startsWith('/admin/collections/users')
    ? 'users'
    : path.startsWith('/admin/collections/quote-rules')
      ? 'quotes'
      : path === '/admin'
        ? tab
        : ''
  return (
    <header className="studio-topbar">
      <div className="studio-topline">
        <Link href="/admin" className="studio-logo">
          <Palette size={22} /> {t('Мастерская')}
        </Link>
        <div className="studio-top-actions">
          <label className="studio-header-language">
            <span>{t('Язык')}</span>
            <select
              aria-label={t('Язык приложения')}
              value={locale}
              onChange={async (event) => {
                if (
                  document.querySelector('.studio-savebox[data-dirty="true"]') &&
                  !window.confirm(t('Есть несохранённые изменения. Сменить язык без сохранения?'))
                )
                  return
                await switchLanguage?.(event.target.value as 'ru' | 'en')
              }}
            >
              <option value="ru">{t('Русский')}</option>
              <option value="en">English</option>
            </select>
          </label>
          <a href={`/${locale}`} target="_blank" rel="noreferrer">
            {t('Открыть сайт')}
            <ExternalLink size={15} />
          </a>
          <details className="studio-technical">
            <summary aria-label={t('Дополнительные инструменты')}>
              <Settings2 size={19} />
            </summary>
            <div>
              <strong>{t('Для специалиста')}</strong>
              {can(user, 'gallery') && (
                <Link href="/admin/collections/artworks">{t('Редактор Payload')}</Link>
              )}
              {can(user, 'artist') && (
                <Link href="/admin/globals/studio">{t('Настройки Payload')}</Link>
              )}
              <Link href="/admin/collections/media">{t('Медиатека')}</Link>
              {can(user, 'requests') && (
                <Link href="/admin/collections/requests">{t('Технические данные заявок')}</Link>
              )}
              {can(user, 'requests') && (
                <Link href="/admin/collections/references">{t('Приватные файлы')}</Link>
              )}
              <a href="/api/artworks" target="_blank" rel="noreferrer">
                {t('API галерей ↗')}
              </a>
              <Link href="/admin/account">{t('Мой аккаунт')}</Link>
              <Link href="/admin/logout">{t('Выйти')}</Link>
            </div>
          </details>
        </div>
      </div>
      <nav aria-label={t('Разделы мастерской')}>
        {tabs
          .filter(([key]) => can(user, key as Section))
          .map(([key, label, href]) => (
            <Link key={key} href={href} aria-current={active === key ? 'page' : undefined}>
              {t(label)}
            </Link>
          ))}
      </nav>
    </header>
  )
}
