'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe2 } from 'lucide-react'
import type { Studio } from '@/payload-types'
import { GalleryPanel } from './studio-gallery'
import { RequestsPanel } from './studio-requests'
import { SaveBox } from './studio-controls'
import { studioAPI, jsonRequest, contentQuery } from './studio-api'

function ArtistPanel({ locale }: { locale: 'ru' | 'en' }) {
  const [artist, setArtist] = useState<Studio | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setArtist(null)
    setError('')
    studioAPI<Studio>(`/api/globals/studio?${contentQuery(locale)}`, { signal: controller.signal })
      .then(setArtist)
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message)
      })
    return () => controller.abort()
  }, [locale])
  async function save(data: unknown) {
    const result = await studioAPI<{ result?: Studio; doc?: Studio } & Studio>(
      `/api/globals/studio?${contentQuery(locale)}`,
      jsonRequest('POST', data),
    )
    setArtist(result.result || result.doc || result)
  }
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <p className="studio-overline">ЛИЦО ВАШЕЙ МАСТЕРСКОЙ</p>
          <h1>Художник</h1>
          <p>Имя, контакты и рассказ о вас. Заполненные ссылки появятся на сайте.</p>
        </div>
      </div>
      {!artist ? (
        <p role={error ? 'alert' : 'status'}>{error || 'Загружаем настройки…'}</p>
      ) : (
        <div className="studio-editor-grid">
          <div>
            <SaveBox
              title="Имя и контакты"
              help="Эти данные общие для русского и английского сайта."
              onSave={async (data) =>
                save(
                  Object.fromEntries(
                    ['name', 'alias', 'instagram', 'telegram', 'email'].map((key) => [
                      key,
                      String(data.get(key) || '').trim(),
                    ]),
                  ),
                )
              }
            >
              <label>
                Имя художника
                <input
                  name="name"
                  defaultValue={artist.name || ''}
                  placeholder="Например: Анна Иванова"
                />
              </label>
              <label>
                Псевдоним / название студии
                <input
                  name="alias"
                  defaultValue={artist.alias || ''}
                  placeholder="Например: ANNA ART"
                />
              </label>
              <label>
                Instagram
                <input
                  name="instagram"
                  type="url"
                  defaultValue={artist.instagram || ''}
                  placeholder="https://www.instagram.com/your_name/"
                />
              </label>
              <label>
                Telegram
                <input
                  name="telegram"
                  type="url"
                  defaultValue={artist.telegram || ''}
                  placeholder="https://t.me/your_name"
                />
              </label>
              <label>
                Почта для посетителей
                <input
                  name="email"
                  type="email"
                  defaultValue={artist.email || ''}
                  placeholder="hello@example.com"
                />
              </label>
            </SaveBox>
          </div>
          <div>
            <SaveBox
              title={`О художнике · ${locale === 'ru' ? 'Русский' : 'English'}`}
              onSave={async (data) => save({ about: String(data.get('about') || '') })}
            >
              <label>
                Биография
                <textarea
                  name="about"
                  rows={8}
                  defaultValue={artist.about || ''}
                  placeholder="Что вас вдохновляет, как вы работаете, какие сюжеты вам близки"
                />
              </label>
            </SaveBox>
            <SaveBox
              title="Индивидуальные заказы"
              onSave={async (data) => save({ commissionsOpen: data.has('commissionsOpen') })}
            >
              <label className="studio-check">
                <input
                  name="commissionsOpen"
                  type="checkbox"
                  defaultChecked={artist.commissionsOpen !== false}
                />{' '}
                Принимать заказы
              </label>
              <p className="studio-hint">
                Если выключить, форма на сайте покажет, что приём временно закрыт.
              </p>
            </SaveBox>
          </div>
        </div>
      )}
    </>
  )
}

export function StudioWorkspace() {
  const query = useSearchParams()
  const tab = query.get('tab') || 'gallery'
  const [locale, setLocale] = useState<'ru' | 'en'>('ru')
  const canLeave = () =>
    !document.querySelector('.studio-savebox[data-dirty="true"]') ||
    window.confirm('Есть несохранённые изменения. Уйти без сохранения?')
  useEffect(() => {
    const guard = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest('a[href], button.studio-back') : null
      if (!target || (target instanceof HTMLAnchorElement && target.target === '_blank')) return
      if (!canLeave()) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('click', guard, true)
    return () => document.removeEventListener('click', guard, true)
  }, [])
  return (
    <main className="studio-workspace" aria-label="Ваша мастерская">
      {tab !== 'requests' && (
        <div className="studio-language">
          <Globe2 size={17} />
          <label>
            Язык содержимого
            <select
              value={locale}
              onChange={(event) => {
                if (canLeave()) setLocale(event.target.value as 'ru' | 'en')
              }}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>
          <span>Интерфейс остаётся на русском</span>
        </div>
      )}
      {tab === 'artist' ? (
        <ArtistPanel key={locale} locale={locale} />
      ) : tab === 'requests' ? (
        <RequestsPanel />
      ) : (
        <GalleryPanel locale={locale} />
      )}
    </main>
  )
}
