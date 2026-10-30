'use client'
import { useAdminLocale, useAdminText } from './studio-locale'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Mail, Paperclip, Search } from 'lucide-react'
import type { Request as StudioRequest, Reference } from '@/payload-types'
import { requestStatuses, requestSummary } from '@/lib/studio-admin'
import { studioAPI, jsonRequest, type Page } from './studio-api'
import { useAuth } from '@payloadcms/ui'
import type { User } from '@/payload-types'
import { can } from '@/lib/studio-access'
import { SortHeader } from './studio-sort'
import { Pagination, SaveBox } from './studio-controls'

const kinds: Record<string, string> = {
  purchase: 'Покупка работы',
  commission: 'Картина на заказ',
  question: 'Вопрос',
}
const channels: Record<string, string> = {
  email: 'Почта',
  telegram: 'Telegram',
  instagram: 'Instagram',
}
const date = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function StatusSelect({
  request,
  onSaved,
}: {
  request: StudioRequest
  onSaved: (request: StudioRequest) => void
}) {
  const t = useAdminText()

  const [status, setStatus] = useState<string>(request.status || 'new')
  const { user } = useAuth<User>()
  useEffect(() => setStatus(request.status || 'new'), [request.status])
  return (
    <SaveBox
      title={t('Статус заявки')}
      changed={status !== (request.status || 'new')}
      onSave={async () => {
        if (!window.confirm(t(`Подтвердить изменение статуса заявки ${request.reference}?`)))
          return Promise.reject(new Error(t('Изменение не подтверждено.')))
        const result = await studioAPI<{ doc: StudioRequest }>(
          `/api/requests/${request.id}?depth=2`,
          jsonRequest('PATCH', { status }),
        )
        onSaved(result.doc)
      }}
    >
      <select
        aria-label={t(`Статус ${request.reference}`)}
        value={status}
        disabled={!can(user, 'requests', 'edit')}
        onChange={(event) => setStatus(event.target.value)}
      >
        {requestStatuses.map(([value, label]) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </select>
    </SaveBox>
  )
}

export function RequestsPanel() {
  const t = useAdminText()
  const locale = useAdminLocale()

  const [archive, setArchive] = useState(false)
  const [sort, setSort] = useState('-createdAt')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page<StudioRequest> | null>(null)
  const [selected, setSelected] = useState<StudioRequest | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setLoading(true)
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        depth: '2',
        limit: '20',
        page: String(page),
        sort,
      })
      params.set(`where[and][0][status][${archive ? 'in' : 'not_in'}]`, 'completed,cancelled')
      if (status !== 'all') params.set('where[and][2][status][equals]', status)
      if (query.trim())
        ['reference', 'name', 'contact'].forEach((key, index) =>
          params.set(`where[and][1][or][${index}][${key}][contains]`, query.trim()),
        )
      studioAPI<Page<StudioRequest>>(`/api/requests?${params}`, { signal: controller.signal })
        .then(setData)
        .catch((error) => {
          if (error.name !== 'AbortError') setError(error.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, status, page, revision, archive, sort])
  function saved(request: StudioRequest) {
    setSelected((previous) => (previous?.id === request.id ? request : previous))
    setData((previous) =>
      previous
        ? {
            ...previous,
            docs: previous.docs.map((item) => (item.id === request.id ? request : item)),
          }
        : null,
    )
    setRevision((value) => value + 1)
  }
  if (selected) {
    const details =
      selected.details && typeof selected.details === 'object' && !Array.isArray(selected.details)
        ? (selected.details as Record<string, unknown>)
        : {}
    const references = (selected.references || []).filter((value): value is Reference =>
      Boolean(value && typeof value === 'object'),
    )
    const rows = requestSummary(details)
    const link =
      typeof details.referenceLink === 'string' && /^https?:\/\//.test(details.referenceLink)
        ? details.referenceLink
        : null
    return (
      <>
        <button className="studio-back" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> {t('Все заявки')}
        </button>
        <div className="studio-page-heading">
          <div>
            <p className="studio-overline">
              {t(kinds[selected.kind])} · {date(selected.createdAt, locale)}
            </p>
            <h1>{selected.reference}</h1>
            <p>{t('Обращение и файлы доступны только сотрудникам.')}</p>
          </div>
        </div>
        <div className="studio-editor-grid">
          <div>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>{t('От кого')}</h2>
              </div>
              <div className="studio-sender">
                <span className="studio-avatar">
                  {(selected.name || selected.contact).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{selected.name || t('Имя не указано')}</strong>
                  <p>
                    {t(channels[selected.channel])} ·{' '}
                    {selected.channel === 'email' ? (
                      <a href={`mailto:${selected.contact}`}>{selected.contact}</a>
                    ) : (
                      selected.contact
                    )}
                  </p>
                  <small>{selected.locale === 'ru' ? t('Русский язык') : 'English'}</small>
                </div>
              </div>
            </section>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>{t('Сообщение')}</h2>
              </div>
              <p className="studio-message">
                {selected.message || t('Посетитель не оставил сообщение.')}
              </p>
            </section>
            {rows.length > 0 && (
              <section className="studio-card">
                <div className="studio-card-heading">
                  <h2>{t('Детали заказа')}</h2>
                </div>
                <dl className="studio-definition">
                  {rows.map(([label, value]) => (
                    <div key={t(label)}>
                      <dt>{t(label)}</dt>
                      <dd>{t(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>
                  <Paperclip size={18} /> {t('Референсы ·')}
                  {references.length}
                </h2>
                <p>{t('Изображения, приложенные к этой заявке.')}</p>
              </div>
              {references.length ? (
                <div className="studio-reference-grid">
                  {references.map(
                    (reference) =>
                      reference.url && (
                        <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer">
                          <img
                            src={reference.url}
                            alt={reference.filename || t('Референс клиента')}
                          />
                          <span>
                            {reference.filename}
                            <ExternalLink size={14} />
                          </span>
                        </a>
                      ),
                  )}
                </div>
              ) : (
                <p className="studio-hint">{t('Файлов нет.')}</p>
              )}
              {link && (
                <a className="studio-button secondary" href={link} target="_blank" rel="noreferrer">
                  {t('Ссылка на референс')}
                  <ExternalLink size={15} />
                </a>
              )}
            </section>
          </div>
          <div>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>{t('Статус заявки')}</h2>
                <p>
                  {t(
                    'Выберите статус и сохраните. Завершённые и отменённые заявки попадут в архив.',
                  )}
                </p>
              </div>
              <StatusSelect request={selected} onSaved={saved} />
              <p className="studio-hint">
                {t('Статус заявки не меняет наличие картины автоматически.')}
              </p>
            </section>
            {selected.artwork && typeof selected.artwork === 'object' && (
              <section className="studio-card">
                <div className="studio-card-heading">
                  <h2>{t('Выбранная галерея')}</h2>
                </div>
                <p>{selected.artwork.title || t(`Галерея ${selected.artwork.id}`)}</p>
                <a
                  href={`/${selected.locale}/works/${selected.artwork.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('Открыть на сайте ↗')}
                </a>
              </section>
            )}
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <p className="studio-overline">{t('ОБРАЩЕНИЯ ПОСЕТИТЕЛЕЙ')}</p>
          <h1>{t('Заявки')}</h1>
          <p>{t('Контакт, пожелания и приватные референсы собраны в одном месте.')}</p>
        </div>
        <span className="studio-heading-icon">
          <Mail size={28} />
        </span>
      </div>
      <div className="studio-subtabs" role="tablist" aria-label={t('Заявки')}>
        <button
          className="studio-back"
          role="tab"
          aria-selected={!archive}
          onClick={() => {
            setArchive(false)
            setPage(1)
            setStatus('all')
          }}
        >
          {t('Актуальные')}
        </button>
        <button
          className="studio-back"
          role="tab"
          aria-selected={archive}
          onClick={() => {
            setArchive(true)
            setPage(1)
            setStatus('all')
          }}
        >
          {t('Архив')}
        </button>
      </div>
      <div className="studio-card studio-table-card">
        <div className="studio-table-toolbar">
          <label className="studio-search">
            <Search size={18} />
            <input
              aria-label={t('Поиск заявок')}
              placeholder={t('Номер, имя или контакт')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="studio-status-filter">
            <span className="sr-only">{t('Фильтр по статусу')}</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">{t('Все статусы')}</option>
              {requestStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p className="studio-error" role="alert">
            {error}
          </p>
        )}
        <div className="studio-table-scroll" aria-busy={loading}>
          <table className="studio-table">
            <thead>
              <tr>
                <SortHeader
                  label={t('Заявка')}
                  field="reference"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('От кого')}
                  field="name"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Тип')}
                  field="kind"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Дата')}
                  field="createdAt"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Файлы')}
                  field="referenceCount"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Статус')}
                  field="status"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {data?.docs.map((request) => (
                <tr key={request.id}>
                  <td>
                    <button className="studio-title-button" onClick={() => setSelected(request)}>
                      {request.reference}
                    </button>
                  </td>
                  <td>
                    <strong>{request.name || t('Без имени')}</strong>
                    <small className="studio-contact">{request.contact}</small>
                  </td>
                  <td>{t(kinds[request.kind])}</td>
                  <td className="studio-nowrap">{date(request.createdAt, locale)}</td>
                  <td>{request.references?.length || '—'}</td>
                  <td>
                    <StatusSelect request={request} onSaved={saved} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <p className="studio-loading" role="status">
            {t('Загружаем заявки…')}
          </p>
        )}
        {!loading && !data?.docs.length && (
          <div className="studio-empty">
            {query || status !== 'all'
              ? t('По этим условиям заявок нет.')
              : t('Пока заявок нет. Новые обращения появятся здесь.')}
          </div>
        )}
        {data && (
          <Pagination page={page} pages={data.totalPages} total={data.totalDocs} onPage={setPage} />
        )}
      </div>
    </>
  )
}
