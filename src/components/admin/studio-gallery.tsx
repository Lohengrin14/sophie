'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ExternalLink, Plus, Search, Star, Trash2, Upload, Copy } from 'lucide-react'
import type { Artwork, Media } from '@/payload-types'
import { canvasSize } from '@/lib/canvas-size'
import { formatPriceInput, parsePriceInput } from '@/lib/admin-helpers'
import { money, availabilityLabel } from '@/lib/i18n'
import { relationID } from '@/lib/studio-admin'
import {
  contentQuery,
  galleryImages,
  jsonRequest,
  studioAPI,
  uploadArtImage,
  type Page,
} from './studio-api'
import { BoardSize, CurrencySelect, DimensionFields, Pagination, SaveBox } from './studio-controls'

type Language = 'ru' | 'en'
const publicPath = (work: Artwork, locale: Language) => `/${locale}/works/${work.slug}`
const imageURL = (image: Media) => image.sizes?.card?.url || image.url || ''

export function GalleryPanel({ locale }: { locale: Language }) {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page<Artwork> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (editing !== null) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        locale,
        'fallback-locale': 'none',
        depth: '1',
        limit: '20',
        page: String(page),
        sort: 'sortOrder,id',
      })
      if (query.trim()) params.set('where[title][contains]', query.trim())
      studioAPI<Page<Artwork>>(`/api/artworks?${params}`, { signal: controller.signal })
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
  }, [locale, page, query, editing])
  if (editing === 'new')
    return (
      <NewGallery
        locale={locale}
        onBack={() => setEditing(null)}
        onCreated={(id) => setEditing(id)}
      />
    )
  if (editing !== null)
    return (
      <GalleryEditor
        key={`${editing}-${locale}`}
        id={editing}
        locale={locale}
        onBack={() => setEditing(null)}
      />
    )
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <p className="studio-overline">ВАША КОЛЛЕКЦИЯ</p>
          <h1>Галерея</h1>
          <p>Одна галерея — одна работа и до 10 её изображений.</p>
        </div>
        <button className="studio-button" onClick={() => setEditing('new')}>
          <Plus size={18} /> Добавить галерею
        </button>
      </div>
      <div className="studio-card studio-table-card">
        <div className="studio-table-toolbar">
          <label className="studio-search">
            <Search size={18} />
            <input
              placeholder="Найти по названию"
              aria-label="Поиск галерей"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <span>По приоритету: меньшее число — раньше</span>
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
                <th>Обложка</th>
                <th>Название</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Цена</th>
                <th>Размер, см</th>
                <th>Ссылка на сайте</th>
              </tr>
            </thead>
            <tbody>
              {data?.docs.map((work) => {
                const image = galleryImages(work)[0]
                return (
                  <tr key={work.id}>
                    <td>
                      <button
                        className="studio-thumb-button"
                        aria-label={`Открыть ${work.title || 'галерею'}`}
                        onClick={() => setEditing(work.id)}
                      >
                        {image ? <img src={imageURL(image)} alt="" /> : <span>Нет фото</span>}
                      </button>
                    </td>
                    <td>
                      <button className="studio-title-button" onClick={() => setEditing(work.id)}>
                        {work.title || 'Добавьте перевод названия'}
                      </button>
                      {!work.published && <small className="studio-draft">Черновик</small>}
                    </td>
                    <td>{work.sortOrder ?? 0}</td>
                    <td>
                      <span className={`studio-badge ${work.availability}`}>
                        {availabilityLabel(work.availability, 'ru')}
                      </span>
                    </td>
                    <td className="studio-nowrap">{money(work.priceMinor, work.currency, 'ru')}</td>
                    <td className="studio-nowrap">
                      {work.width} × {work.height}
                    </td>
                    <td>
                      {work.published && work.title ? (
                        <a
                          className="studio-url"
                          href={publicPath(work, locale)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {typeof window === 'undefined' ? '' : window.location.origin}
                          {publicPath(work, locale)} <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="studio-hint">Появится после публикации</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && !data?.docs.length && (
          <div className="studio-empty">
            {query
              ? 'По этому названию ничего не найдено.'
              : 'Здесь появятся ваши галереи. Добавьте первую работу.'}
          </div>
        )}
        {loading && (
          <p className="studio-loading" role="status">
            Загружаем галереи…
          </p>
        )}
        {data && (
          <Pagination page={page} pages={data.totalPages} total={data.totalDocs} onPage={setPage} />
        )}
      </div>
    </>
  )
}

function ImageEditor({
  work,
  locale,
  onSave,
}: {
  work: Artwork
  locale: Language
  onSave: (patch: unknown) => Promise<void>
}) {
  const [images, setImages] = useState(() => galleryImages(work))
  const [cover, setCover] = useState(() => relationID(work.image))
  const [changed, setChanged] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  async function upload(files: File[]) {
    if (images.length + files.length > 10) {
      setError('В одной галерее может быть до 10 изображений.')
      return
    }
    setError('')
    setUploading(true)
    try {
      for (const file of files) {
        const image = await uploadArtImage(file, work.title || 'Изображение галереи', locale)
        setImages((previous) => [...previous, image])
        setChanged(true)
        if (!cover) setCover(image.id)
      }
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setUploading(false)
    }
  }
  return (
    <SaveBox
      title="Изображения"
      help="Обложка видна на главной. Остальные изображения посетитель увидит, когда откроет работу."
      changed={changed && !uploading}
      onSave={async () => {
        if (uploading) throw new Error('Дождитесь загрузки изображений.')
        if (!cover || !images.length)
          throw new Error('Оставьте хотя бы одно изображение и выберите обложку.')
        await onSave({ images: images.map((image) => image.id), image: cover })
        setChanged(false)
      }}
    >
      <div className="studio-images">
        {images.map((image) => (
          <div key={image.id} className={image.id === cover ? 'is-cover' : ''}>
            <button
              type="button"
              className="studio-cover-button"
              onClick={() => {
                setCover(image.id)
                setChanged(true)
              }}
              aria-pressed={image.id === cover}
            >
            <img src={imageURL(image)} alt={image.alt || work.title || ''} />
              <span>
                <Star size={14} />
                {image.id === cover ? 'Обложка' : 'Сделать обложкой'}
              </span>
            </button>
            <button
              type="button"
              className="studio-image-remove"
              disabled={uploading}
              aria-label="Убрать изображение из галереи"
              onClick={() => {
                const remaining = images.filter((item) => item.id !== image.id)
                setImages(remaining)
                if (cover === image.id) setCover(remaining[0]?.id ?? null)
                setChanged(true)
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <label className="studio-upload">
        <Upload size={19} />
        {uploading ? 'Загружаем…' : `Добавить изображения · ${images.length} из 10`}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || images.length >= 10}
          onChange={(event) => {
            void upload(Array.from(event.target.files || []))
            event.target.value = ''
          }}
        />
      </label>
      <p className="studio-hint">
        JPG, PNG или WebP · до 5 МБ каждый. После загрузки нажмите «Сохранить». Удаление здесь
        убирает фото из галереи, но сохраняет его в медиатеке.
      </p>
      {error && (
        <p className="studio-error" role="alert">
          {error}
        </p>
      )}
    </SaveBox>
  )
}

function GalleryEditor({
  id,
  locale,
  onBack,
}: {
  id: number
  locale: Language
  onBack: () => void
}) {
  const [work, setWork] = useState<Artwork | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    studioAPI<Artwork>(`/api/artworks/${id}?${contentQuery(locale)}`, { signal: controller.signal })
      .then(setWork)
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message)
      })
    return () => controller.abort()
  }, [id, locale])
  async function patch(data: unknown) {
    const result = await studioAPI<{ doc: Artwork }>(
      `/api/artworks/${id}?${contentQuery(locale)}`,
      jsonRequest('PATCH', data),
    )
    setWork(result.doc)
  }
  if (!work)
    return (
      <>
        <button className="studio-back" onClick={onBack}>
          <ArrowLeft size={16} /> К галереям
        </button>
        <p role={error ? 'alert' : 'status'}>{error || 'Открываем галерею…'}</p>
      </>
    )
  return (
    <>
      <button className="studio-back" onClick={onBack}>
        <ArrowLeft size={16} /> Все галереи
      </button>
      <div className="studio-page-heading">
        <div>
          <p className="studio-overline">
            ГАЛЕРЕЯ · {locale === 'ru' ? 'РУССКАЯ ВЕРСИЯ' : 'ENGLISH'}
          </p>
          <h1>{work.title || 'Добавьте название'}</h1>
          <p>Каждый блок сохраняется отдельно. Изменения в остальных блоках останутся на месте.</p>
        </div>
        {work.published && work.title && (
          <a
            className="studio-button secondary"
            href={publicPath(work, locale)}
            target="_blank"
            rel="noreferrer"
          >
            На сайте <ExternalLink size={16} />
          </a>
        )}
      </div>
      <div className="studio-editor-grid">
        <div>
          <ImageEditor work={work} locale={locale} onSave={patch} />
          <SaveBox
            title="Название"
            help={`Название для ${locale === 'ru' ? 'русской' : 'английской'} версии сайта.`}
            onSave={async (data) => patch({ title: String(data.get('title')).trim() })}
          >
            <label>
              Название картины
              <input
                name="title"
                defaultValue={work.title || ''}
                required
                maxLength={200}
                placeholder="Например: Вечер у моря"
              />
            </label>
          </SaveBox>
          <SaveBox
            title="Описание"
            help="Текст для этой языковой версии. Можно оставить пустым."
            onSave={async (data) => patch({ description: String(data.get('description') || '') })}
          >
            <label>
              Описание картины
              <textarea
                name="description"
                rows={5}
                defaultValue={work.description || ''}
                placeholder="Несколько слов о работе, материалах и настроении"
              />
            </label>
          </SaveBox>
          <SaveBox
            title="Реальный размер"
            onSave={async (data) =>
              patch({ width: Number(data.get('width')), height: Number(data.get('height')) })
            }
          >
            <DimensionFields width={work.width} height={work.height} />
          </SaveBox>
        </div>
        <div>
          <SaveBox
            title="Публикация и наличие"
            onSave={async (data) =>
              patch({ availability: data.get('availability'), published: data.has('published') })
            }
          >
            <label>
              Наличие
              <select name="availability" defaultValue={work.availability}>
                <option value="available">Доступна</option>
                <option value="reserved">В резерве</option>
                <option value="sold">Продана</option>
              </select>
            </label>
            <label className="studio-check">
              <input name="published" type="checkbox" defaultChecked={work.published || false} />{' '}
              Показывать галерею на сайте
            </label>
            <p className="studio-hint">
              Для каждого языка нужно название. Цена и изображения общие для RU / EN.
            </p>
          </SaveBox>
          <SaveBox
            title="Цена"
            help="Обычная сумма — ничего не нужно умножать на 100. Смена валюты не пересчитывает цену."
            onSave={async (data) => {
              const amount = parsePriceInput(String(data.get('price')))
              if (amount === null) throw new Error('Укажите цену, например 650 или 650,50.')
              await patch({ priceMinor: amount, currency: data.get('currency') })
            }}
          >
            <label>
              Стоимость
              <input
                name="price"
                inputMode="decimal"
                defaultValue={formatPriceInput(work.priceMinor)}
                required
                placeholder="Например: 650,50"
              />
            </label>
            <CurrencySelect value={work.currency} />
          </SaveBox>
          <SaveBox
            title="Приоритет"
            help="Меньшее число — раньше. Первая галерея закреплена слева сверху. Например: 1, 2, 3."
            onSave={async (data) => patch({ sortOrder: Number(data.get('sortOrder')) })}
          >
            <label>
              Порядок на главной
              <input
                name="sortOrder"
                type="number"
                step="1"
                defaultValue={work.sortOrder ?? 0}
                required
              />
            </label>
          </SaveBox>
          <SaveBox
            title="Размер на доске"
            onSave={async (data) => patch({ displaySize: Number(data.get('displaySize')) })}
          >
            <BoardSize value={work.displaySize ?? canvasSize(work.width, work.height).tier} />
          </SaveBox>
          <section className="studio-card">
            <div className="studio-card-heading">
              <h2>Ссылка на работу</h2>
              <p>Адрес сохраняется даже после смены названия.</p>
            </div>
            <a
              className="studio-share-url"
              href={publicPath(work, locale)}
              target="_blank"
              rel="noreferrer"
            >
              {typeof window === 'undefined' ? '' : window.location.origin}
              {publicPath(work, locale)}
            </a>
            <button
              className="studio-button secondary"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(publicPath(work, locale), window.location.origin).href,
                  )
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
            >
              <Copy size={15} />
              {copied ? 'Скопировано' : 'Скопировать ссылку'}
            </button>
            {!work.published && (
              <p className="studio-hint">
                Сейчас это черновик: ссылка заработает после публикации.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function NewGallery({
  locale,
  onBack,
  onCreated,
}: {
  locale: Language
  onBack: () => void
  onCreated: (id: number) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const files = data
      .getAll('files')
      .filter((value): value is File => value instanceof File && value.size > 0)
    if (!files.length || files.length > 10) {
      setError('Добавьте от 1 до 10 изображений.')
      return
    }
    const price = parsePriceInput(String(data.get('price')))
    if (price === null) {
      setError('Укажите обычную цену, например 650 или 650,50.')
      return
    }
    setBusy(true)
    try {
      const images: number[] = []
      for (const file of files)
        images.push((await uploadArtImage(file, String(data.get('title')), locale)).id)
      const result = await studioAPI<{ doc: Artwork }>(
        `/api/artworks?${contentQuery(locale)}`,
        jsonRequest('POST', {
          title: String(data.get('title')).trim(),
          description: '',
          image: images[0],
          images,
          width: Number(data.get('width')),
          height: Number(data.get('height')),
          priceMinor: price,
          currency: data.get('currency'),
          displaySize: Number(data.get('displaySize')),
          sortOrder: Number(data.get('sortOrder')),
          availability: 'available',
          published: false,
          medium: 'oil',
          year: new Date().getFullYear(),
        }),
      )
      onCreated(result.doc.id)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <button className="studio-back" onClick={onBack}>
        <ArrowLeft size={16} /> Все галереи
      </button>
      <div className="studio-page-heading">
        <div>
          <h1>Новая галерея</h1>
          <p>
            Сначала создадим черновик. Обложку, переводы и остальные параметры можно изменить после.
          </p>
        </div>
      </div>
      <form className="studio-card studio-create" onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>
            Название
            <input name="title" required placeholder="Например: Утро у моря" />
          </label>
          <label>
            Изображения · от 1 до 10
            <input
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />
          </label>
          <p className="studio-hint">
            Первое изображение станет обложкой. JPG, PNG или WebP, до 5 МБ каждый.
          </p>
          <DimensionFields />
          <div className="studio-form-row">
            <label>
              Цена
              <input name="price" required inputMode="decimal" placeholder="Например: 650" />
            </label>
            <CurrencySelect />
          </div>
          <label>
            Приоритет
            <input type="number" step="1" name="sortOrder" defaultValue={0} required />
          </label>
          <BoardSize value={3} />
          <button className="studio-button" type="submit" disabled={busy}>
            {busy ? 'Создаём галерею…' : 'Создать черновик'}
          </button>
        </fieldset>
        {error && (
          <p className="studio-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  )
}
