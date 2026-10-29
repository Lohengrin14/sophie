'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Mail, Paperclip, Search } from 'lucide-react'
import type { Request as StudioRequest, Reference } from '@/payload-types'
import { requestStatuses, requestSummary } from '@/lib/studio-admin'
import { studioAPI, jsonRequest, type Page } from './studio-api'
import { Pagination } from './studio-controls'

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
const date = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )

function StatusSelect({
  request,
  onSaved,
}: {
  request: StudioRequest
  onSaved: (request: StudioRequest) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="studio-status-control">
      <select
        aria-label={`Статус ${request.reference}`}
        value={request.status || 'new'}
        disabled={busy}
        onChange={async (event) => {
          const status = event.target.value
          setBusy(true)
          setError('')
          try {
            const result = await studioAPI<{ doc: StudioRequest }>(
              `/api/requests/${request.id}?depth=2`,
              jsonRequest('PATCH', { status }),
            )
            onSaved(result.doc)
          } catch (error) {
            setError((error as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        {requestStatuses.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {busy && <small role="status">Сохраняем…</small>}
      {error && (
        <small className="studio-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export function RequestsPanel() {
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
        sort: '-createdAt',
      })
      if (status !== 'all') params.set('where[and][0][status][equals]', status)
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
  }, [query, status, page, revision])
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
          <ArrowLeft size={16} /> Все заявки
        </button>
        <div className="studio-page-heading">
          <div>
            <p className="studio-overline">
              {kinds[selected.kind]} · {date(selected.createdAt)}
            </p>
            <h1>{selected.reference}</h1>
            <p>Обращение и файлы доступны только сотрудникам.</p>
          </div>
        </div>
        <div className="studio-editor-grid">
          <div>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>От кого</h2>
              </div>
              <div className="studio-sender">
                <span className="studio-avatar">
                  {(selected.name || selected.contact).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{selected.name || 'Имя не указано'}</strong>
                  <p>
                    {channels[selected.channel]} ·{' '}
                    {selected.channel === 'email' ? (
                      <a href={`mailto:${selected.contact}`}>{selected.contact}</a>
                    ) : (
                      selected.contact
                    )}
                  </p>
                  <small>{selected.locale === 'ru' ? 'Русский язык' : 'English'}</small>
                </div>
              </div>
            </section>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>Сообщение</h2>
              </div>
              <p className="studio-message">
                {selected.message || 'Посетитель не оставил сообщение.'}
              </p>
            </section>
            {rows.length > 0 && (
              <section className="studio-card">
                <div className="studio-card-heading">
                  <h2>Детали заказа</h2>
                </div>
                <dl className="studio-definition">
                  {rows.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>
                  <Paperclip size={18} /> Референсы · {references.length}
                </h2>
                <p>Изображения, приложенные к этой заявке.</p>
              </div>
              {references.length ? (
                <div className="studio-reference-grid">
                  {references.map(
                    (reference) =>
                      reference.url && (
                        <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer">
                          <img src={reference.url} alt={reference.filename || 'Референс клиента'} />
                          <span>
                            {reference.filename}
                            <ExternalLink size={14} />
                          </span>
                        </a>
                      ),
                  )}
                </div>
              ) : (
                <p className="studio-hint">Файлов нет.</p>
              )}
              {link && (
                <a className="studio-button secondary" href={link} target="_blank" rel="noreferrer">
                  Ссылка на референс <ExternalLink size={15} />
                </a>
              )}
            </section>
          </div>
          <div>
            <section className="studio-card">
              <div className="studio-card-heading">
                <h2>Статус заявки</h2>
                <p>Выберите следующий этап — он сохранится сразу.</p>
              </div>
              <StatusSelect request={selected} onSaved={saved} />
              <p className="studio-hint">Статус заявки не меняет наличие картины автоматически.</p>
            </section>
            {selected.artwork && typeof selected.artwork === 'object' && (
              <section className="studio-card">
                <div className="studio-card-heading">
                  <h2>Выбранная галерея</h2>
                </div>
                <p>{selected.artwork.title || `Галерея ${selected.artwork.id}`}</p>
                <a
                  href={`/${selected.locale}/works/${selected.artwork.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть на сайте ↗
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
          <p className="studio-overline">ОБРАЩЕНИЯ ПОСЕТИТЕЛЕЙ</p>
          <h1>Заявки</h1>
          <p>Контакт, пожелания и приватные референсы собраны в одном месте.</p>
        </div>
        <span className="studio-heading-icon">
          <Mail size={28} />
        </span>
      </div>
      <div className="studio-card studio-table-card">
        <div className="studio-table-toolbar">
          <label className="studio-search">
            <Search size={18} />
            <input
              aria-label="Поиск заявок"
              placeholder="Номер, имя или контакт"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="studio-status-filter">
            <span className="sr-only">Фильтр по статусу</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">Все статусы</option>
              {requestStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
                <th>Заявка</th>
                <th>От кого</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Файлы</th>
                <th>Статус</th>
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
                    <strong>{request.name || 'Без имени'}</strong>
                    <small className="studio-contact">{request.contact}</small>
                  </td>
                  <td>{kinds[request.kind]}</td>
                  <td className="studio-nowrap">{date(request.createdAt)}</td>
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
            Загружаем заявки…
          </p>
        )}
        {!loading && !data?.docs.length && (
          <div className="studio-empty">
            {query || status !== 'all'
              ? 'По этим условиям заявок нет.'
              : 'Пока заявок нет. Новые обращения появятся здесь.'}
          </div>
        )}
        {data && (
          <Pagination page={page} pages={data.totalPages} total={data.totalDocs} onPage={setPage} />
        )}
      </div>
    </>
  )
}
