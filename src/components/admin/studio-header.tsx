'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ExternalLink, Palette, Settings2 } from 'lucide-react'

export function StudioNav() {
  return null
}
export function StudioHeader() {
  const path = usePathname()
  const query = useSearchParams()
  const tab = query.get('tab') || 'gallery'
  const tabs = [
    ['artist', 'Художник', '/admin?tab=artist'],
    ['users', 'Сотрудники', '/admin/collections/users'],
    ['gallery', 'Галерея', '/admin'],
    ['quotes', 'Ориентиры заказов', '/admin/collections/quote-rules'],
    ['requests', 'Заявки', '/admin?tab=requests'],
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
          <Palette size={22} /> Мастерская
        </Link>
        <div className="studio-top-actions">
          <a href="/ru" target="_blank" rel="noreferrer">
            Открыть сайт <ExternalLink size={15} />
          </a>
          <details className="studio-technical">
            <summary aria-label="Дополнительные инструменты">
              <Settings2 size={19} />
            </summary>
            <div>
              <strong>Для специалиста</strong>
              <Link href="/admin/collections/artworks">Редактор Payload</Link>
              <Link href="/admin/globals/studio">Настройки Payload</Link>
              <Link href="/admin/collections/media">Медиатека</Link>
              <Link href="/admin/collections/requests">Технические данные заявок</Link>
              <Link href="/admin/collections/references">Приватные файлы</Link>
              <a href="/api/artworks" target="_blank" rel="noreferrer">
                API галерей ↗
              </a>
              <Link href="/admin/account">Мой аккаунт</Link>
              <Link href="/admin/logout">Выйти</Link>
            </div>
          </details>
        </div>
      </div>
      <nav aria-label="Разделы мастерской">
        {tabs.map(([key, label, href]) => (
          <Link key={key} href={href} aria-current={active === key ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
