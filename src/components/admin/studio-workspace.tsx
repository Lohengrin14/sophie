'use client'
import { useAdminText } from './studio-locale'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'
import type { User, Media } from '@/payload-types'
import { can, sections, type Section } from '@/lib/studio-access'
import { useAdminLocale } from './studio-locale'
import { StaffPanel, QuotesPanel } from './studio-management'
import type { Studio } from '@/payload-types'
import { GalleryPanel } from './studio-gallery'
import { RequestsPanel } from './studio-requests'
import { SaveBox } from './studio-controls'
import { SellerSettings } from './studio-seller'
import { studioAPI, jsonRequest, contentQuery, uploadArtImage } from './studio-api'

function ArtistPanel({ locale }: { locale: 'ru' | 'en' }) {
  const t = useAdminText()

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
          <p className="studio-overline">{t('ЛИЦО ВАШЕЙ МАСТЕРСКОЙ')}</p>
          <h1>{t('Художник')}</h1>
          <p>{t('Имя, контакты и рассказ о вас. Заполненные ссылки появятся на сайте.')}</p>
        </div>
      </div>
      {!artist ? (
        <p role={error ? 'alert' : 'status'}>{error || t('Загружаем настройки…')}</p>
      ) : (
        <div className="studio-editor-grid">
          <div>
            <ArtistPhoto artist={artist} locale={locale} onSave={save} />
            <SaveBox
              title={t('Имя и контакты')}
              help={t('Эти данные общие для русского и английского сайта.')}
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
                {t('Имя художника')}
                <input
                  name="name"
                  defaultValue={artist.name || ''}
                  placeholder={t('Например: Анна Иванова')}
                />
              </label>
              <label>
                {t('Псевдоним / название студии')}
                <input
                  name="alias"
                  defaultValue={artist.alias || ''}
                  placeholder={t('Например: ANNA ART')}
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
                {t('Почта для посетителей')}
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
              title={t(`О художнике · ${locale === 'ru' ? t('Русский') : 'English'}`)}
              onSave={async (data) => save({ about: String(data.get('about') || '') })}
            >
              <label>
                {t('Биография')}
                <textarea
                  name="about"
                  rows={8}
                  defaultValue={artist.about || ''}
                  placeholder={t('Что вас вдохновляет, как вы работаете, какие сюжеты вам близки')}
                />
              </label>
            </SaveBox>
            <SaveBox
              title={t('Индивидуальные заказы')}
              onSave={async (data) => save({ commissionsOpen: data.has('commissionsOpen') })}
            >
              <label className="studio-check">
                <input
                  name="commissionsOpen"
                  type="checkbox"
                  defaultChecked={artist.commissionsOpen !== false}
                />{' '}
                {t('Принимать заказы')}
              </label>
              <p className="studio-hint">
                {t('Если выключить, форма на сайте покажет, что приём временно закрыт.')}
              </p>
            </SaveBox>
            <SellerSettings artist={artist} locale={locale} onSave={save} />
          </div>
        </div>
      )}
    </>
  )
}

export function StudioWorkspace() {
  const t = useAdminText()

  const { user } = useAuth<User>()
  const query = useSearchParams()
  const tab =
    query.get('tab') ||
    (['gallery', 'artist', 'users', 'quotes', 'requests'] as Section[]).find((section) =>
      can(user, section),
    ) ||
    'gallery'
  const locale = useAdminLocale()
  const section = tab as Section
  const canLeave = () =>
    !document.querySelector('.studio-savebox[data-dirty="true"]') ||
    window.confirm(t('Есть несохранённые изменения. Уйти без сохранения?'))
  useEffect(() => {
    const guard = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest(
              'a[href], button.studio-back, button.studio-sort, button[data-studio-navigation]',
            )
          : null
      if (!target || (target instanceof HTMLAnchorElement && target.target === '_blank')) return
      if (!canLeave()) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (document.querySelector('.studio-savebox[data-dirty="true"]')) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    document.addEventListener('click', guard, true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('click', guard, true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [locale])
  return (
    <main className="studio-workspace" aria-label={t('Ваша мастерская')}>
      {!sections.includes(section) || !can(user, section) ? (
        <p role="status">{t('Нет доступа к разделу. Выберите доступную вкладку в шапке.')}</p>
      ) : tab === 'users' ? (
        <StaffPanel />
      ) : tab === 'quotes' ? (
        <QuotesPanel />
      ) : tab === 'artist' ? (
        <ArtistPanel key={locale} locale={locale} />
      ) : tab === 'requests' ? (
        <RequestsPanel />
      ) : (
        <GalleryPanel locale={locale} />
      )}
    </main>
  )
}

function ArtistPhoto({
  artist,
  locale,
  onSave,
}: {
  artist: Studio
  locale: 'ru' | 'en'
  onSave: (data: unknown) => Promise<void>
}) {
  const t = useAdminText()

  const [photo, setPhoto] = useState<Media | null>(
    typeof artist.photo === 'object' ? artist.photo : null,
  )
  const [changed, setChanged] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <SaveBox
      title={t('Фотография художника')}
      help={t('Появится на странице о художнике. JPG, PNG или WebP, до 4 МБ.')}
      changed={changed}
      onSave={async () => {
        if (busy) throw new Error(t('Дождитесь загрузки.'))
        await onSave({ photo: photo?.id || null })
        setChanged(false)
      }}
    >
      {photo?.url && (
        <img className="studio-artist-photo" src={photo.url} alt={t('Фотография художника')} />
      )}
      <input
        aria-label={t('Загрузить фотографию художника')}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setBusy(true)
          setError('')
          try {
            setPhoto(await uploadArtImage(file, t('Фотография художника'), locale))
            setChanged(true)
          } catch (error) {
            setError((error as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      />
      {photo && (
        <button
          type="button"
          className="studio-button secondary"
          onClick={() => {
            setPhoto(null)
            setChanged(true)
          }}
        >
          {t('Убрать фотографию')}
        </button>
      )}
      {busy && <p role="status">{t('Загружаем…')}</p>}
      {error && <p role="alert">{t(error)}</p>}
    </SaveBox>
  )
}
