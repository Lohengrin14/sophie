'use client'
import { useAdminText } from './studio-locale'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ExternalLink, Plus, Search, Star, Trash2, Upload, Copy } from 'lucide-react'
import type { Artwork, Media } from '@/payload-types'
import { useAuth } from '@payloadcms/ui'
import { can } from '@/lib/studio-access'
import type { User } from '@/payload-types'
import { SortHeader } from './studio-sort'
import { formatPriceInput } from '@/lib/admin-helpers'
import { readArtworkPrices } from '@/lib/artwork-prices'
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
import { Priority, BoardSize, DimensionFields, Pagination, SaveBox } from './studio-controls'

type Language = 'ru' | 'en'
const publicPath = (work: Artwork, locale: Language) => `/${locale}/works/${work.slug}`
const imageURL = (image: Media) => image.sizes?.card?.url || image.url || ''

export function GalleryPanel({ locale }: { locale: Language }) {
  const t = useAdminText()

  const { user } = useAuth<User>()
  const [sort, setSort] = useState('sortOrder')
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
        sort: sort === 'sortOrder' ? 'sortOrder,-displaySize,title,id' : `${sort},id`,
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
  }, [locale, page, query, editing, sort])
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
          <p className="studio-overline">{t('ВАША КОЛЛЕКЦИЯ')}</p>
          <h1>{t('Галерея')}</h1>
          <p>{t('Одна галерея — одна работа и до 10 её изображений.')}</p>
        </div>
        {can(user, 'gallery', 'edit') && (
          <button className="studio-button" onClick={() => setEditing('new')}>
            <Plus size={18} /> {t('Добавить галерею')}
          </button>
        )}
      </div>
      <div className="studio-card studio-table-card">
        <div className="studio-table-toolbar">
          <label className="studio-search">
            <Search size={18} />
            <input
              placeholder={t('Найти по названию')}
              aria-label={t('Поиск галерей')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <span>{t('По приоритету: меньшее число — раньше')}</span>
        </div>
        {error && (
          <p className="studio-error" role="alert">
            {t(error)}
          </p>
        )}
        <div className="studio-table-scroll" aria-busy={loading}>
          <table className="studio-table">
            <thead>
              <tr>
                <SortHeader
                  label={t('Обложка')}
                  field="image"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Название')}
                  field="title"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Приоритет')}
                  field="sortOrder"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Статус')}
                  field="availability"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Цена, ₽')}
                  field="priceRubMinor"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Цена, $')}
                  field="priceUsdMinor"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Размер, см')}
                  field="width"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
                <SortHeader
                  label={t('Ссылка на сайте')}
                  field="slug"
                  sort={sort}
                  onSort={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                />
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
                        aria-label={t(`Открыть ${work.title || t('галерею')}`)}
                        onClick={() => setEditing(work.id)}
                      >
                        {image ? (
                          <img src={imageURL(image)} alt="" />
                        ) : (
                          <span>{t('Нет фото')}</span>
                        )}
                      </button>
                    </td>
                    <td>
                      <button className="studio-title-button" onClick={() => setEditing(work.id)}>
                        {work.title || t('Добавьте перевод названия')}
                      </button>
                      {!work.published && <small className="studio-draft">{t('Черновик')}</small>}
                    </td>
                    <td>{work.sortOrder ?? 0}</td>
                    <td>
                      <span className={`studio-badge ${work.availability}`}>
                        {work.availability === 'sold' ? t('Продана') : t('Доступна')}
                      </span>
                    </td>
                    <td className="studio-nowrap">
                      {typeof work.priceRubMinor === 'number'
                        ? money(work.priceRubMinor, 'RUB', locale)
                        : '—'}
                    </td>
                    <td className="studio-nowrap">
                      {typeof work.priceUsdMinor === 'number'
                        ? money(work.priceUsdMinor, 'USD', locale)
                        : '—'}
                    </td>
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
                        <span className="studio-hint">{t('Появится после публикации')}</span>
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
              ? t('По этому названию ничего не найдено.')
              : t('Здесь появятся ваши галереи. Добавьте первую работу.')}
          </div>
        )}
        {loading && (
          <p className="studio-loading" role="status">
            {t('Загружаем галереи…')}
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
  const t = useAdminText()

  const [images, setImages] = useState(() => galleryImages(work))
  const [cover, setCover] = useState(() => relationID(work.image))
  const [changed, setChanged] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  async function upload(files: File[]) {
    if (images.length + files.length > 10) {
      setError(t('В одной галерее может быть до 10 изображений.'))
      return
    }
    setError('')
    setUploading(true)
    try {
      for (const file of files) {
        const image = await uploadArtImage(file, work.title || t('Изображение галереи'), locale)
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
      title={t('Изображения')}
      help={t(
        'Обложка видна на главной. Остальные изображения посетитель увидит, когда откроет работу.',
      )}
      changed={changed && !uploading}
      onSave={async () => {
        if (uploading) throw new Error(t('Дождитесь загрузки изображений.'))
        if (!cover || !images.length)
          throw new Error(t('Оставьте хотя бы одно изображение и выберите обложку.'))
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
                {image.id === cover ? t('Обложка') : t('Сделать обложкой')}
              </span>
            </button>
            <button
              type="button"
              className="studio-image-remove"
              disabled={uploading}
              aria-label={t('Убрать изображение из галереи')}
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
        {uploading ? t('Загружаем…') : t(`Добавить изображения · ${images.length} из 10`)}
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
        {t(
          'JPG, PNG или WebP · до 4 МБ каждый. После загрузки нажмите «Сохранить». Удаление здесь убирает фото из галереи, но сохраняет его в медиатеке.',
        )}
      </p>
      {error && (
        <p className="studio-error" role="alert">
          {t(error)}
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
  const t = useAdminText()

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
          <ArrowLeft size={16} /> {t('К галереям')}
        </button>
        <p role={error ? 'alert' : 'status'}>{error || t('Открываем галерею…')}</p>
      </>
    )
  return (
    <>
      <button className="studio-back" onClick={onBack}>
        <ArrowLeft size={16} /> {t('Все галереи')}
      </button>
      <div className="studio-page-heading">
        <div>
          <p className="studio-overline">
            {t('ГАЛЕРЕЯ ·')}
            {locale === 'ru' ? t('РУССКАЯ ВЕРСИЯ') : 'ENGLISH'}
          </p>
          <h1>{work.title || t('Добавьте название')}</h1>
          <p>
            {t(
              'Каждый блок сохраняется отдельно. Изменения в остальных блоках останутся на месте.',
            )}
          </p>
        </div>
        {work.published && work.title && (
          <a
            className="studio-button secondary"
            href={publicPath(work, locale)}
            target="_blank"
            rel="noreferrer"
          >
            {t('На сайте')}
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      <div className="studio-editor-grid">
        <div>
          <ImageEditor work={work} locale={locale} onSave={patch} />
          <SaveBox
            title={t('Название')}
            help={t(
              `Название для ${locale === 'ru' ? t('русской') : t('английской')} версии сайта.`,
            )}
            onSave={async (data) => patch({ title: String(data.get('title')).trim() })}
          >
            <label>
              {t('Название картины')}
              <input
                name="title"
                defaultValue={work.title || ''}
                required
                maxLength={200}
                placeholder={t('Например: Вечер у моря')}
              />
            </label>
          </SaveBox>
          <SaveBox
            title={t('Описание')}
            help={t(
              'Текст появится на странице картины. Для русского и английского языков он заполняется отдельно.',
            )}
            onSave={async (data) => patch({ description: String(data.get('description') || '') })}
          >
            <label>
              {t('Описание картины')}
              <textarea
                name="description"
                rows={5}
                defaultValue={work.description || ''}
                placeholder={t(
                  'Например: Вечерний свет на воде. Работа написана с натуры на берегу моря.',
                )}
              />
            </label>
          </SaveBox>
          <SaveBox
            title={t('Реальный размер')}
            onSave={async (data) =>
              patch({ width: Number(data.get('width')), height: Number(data.get('height')) })
            }
          >
            <DimensionFields width={work.width} height={work.height} />
          </SaveBox>
        </div>
        <div>
          <SaveBox
            title={t('Публикация и наличие')}
            onSave={async (data) =>
              patch({ availability: data.get('availability'), published: data.has('published') })
            }
          >
            <label>
              {t('Наличие')}
              <select name="availability" defaultValue={work.availability}>
                <option value="available">{t('Доступна')}</option>
                <option value="sold">{t('Продана')}</option>
              </select>
            </label>
            <label className="studio-check">
              <input name="published" type="checkbox" defaultChecked={work.published || false} />{' '}
              {t('Показывать галерею на сайте')}
            </label>
            <p className="studio-hint">
              {t('Для каждого языка нужно название. Изображения общие для RU / EN.')}
            </p>
          </SaveBox>
          <SaveBox
            title={t('Цены')}
            help={t(
              'Две независимые цены без пересчёта. Оставьте поле пустым, чтобы скрыть цену в этой версии сайта.',
            )}
            onSave={async (data) => {
              await patch(readArtworkPrices(data))
            }}
          >
            <ArtworkPriceFields work={work} />
          </SaveBox>
          <SaveBox
            title={t('Приоритет')}
            help={t(
              '1 — первое место, 50 — последнее. Размер холста не влияет на размер на главной.',
            )}
            onSave={async (data) => patch({ sortOrder: Number(data.get('sortOrder')) })}
          >
            <Priority value={work.sortOrder} />
          </SaveBox>
          <SaveBox
            title={t('Размер на доске')}
            onSave={async (data) => patch({ displaySize: Number(data.get('displaySize')) })}
          >
            <BoardSize value={work.displaySize ?? 4} />
          </SaveBox>
          <section className="studio-card">
            <div className="studio-card-heading">
              <h2>{t('Ссылка на работу')}</h2>
              <p>{t('Адрес сохраняется даже после смены названия.')}</p>
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
              {copied ? t('Скопировано') : t('Скопировать ссылку')}
            </button>
            {!work.published && (
              <p className="studio-hint">
                {t('Сейчас это черновик: ссылка заработает после публикации.')}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function ArtworkPriceFields({ work }: { work?: Artwork }) {
  const t = useAdminText()
  return (
    <div className="studio-form-row">
      <label>
        {t('Рубли ₽ · русская версия')}
        <input
          name="priceRub"
          inputMode="decimal"
          defaultValue={formatPriceInput(work?.priceRubMinor)}
          placeholder={t('Не показывать цену')}
        />
      </label>
      <label>
        {t('Доллары $ · английская версия')}
        <input
          name="priceUsd"
          inputMode="decimal"
          defaultValue={formatPriceInput(work?.priceUsdMinor)}
          placeholder={t('Не показывать цену')}
        />
      </label>
    </div>
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
  const t = useAdminText()

  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const files = data
      .getAll('files')
      .filter((value): value is File => value instanceof File && value.size > 0)
    if (!files.length || files.length > 10) {
      setError(t('Добавьте от 1 до 10 изображений.'))
      return
    }
    let prices
    try {
      prices = readArtworkPrices(data)
    } catch (error) {
      setError(t((error as Error).message))
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
          description: String(data.get('description') || '').trim(),
          image: images[0],
          images,
          width: Number(data.get('width')),
          height: Number(data.get('height')),
          ...prices,
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
        <ArrowLeft size={16} /> {t('Все галереи')}
      </button>
      <div className="studio-page-heading">
        <div>
          <h1>{t('Новая галерея')}</h1>
          <p>
            {t(
              'Сначала создадим черновик. Обложку, переводы и остальные параметры можно изменить после.',
            )}
          </p>
        </div>
      </div>
      <form
        className="studio-card studio-create studio-savebox"
        data-dirty={dirty}
        onChange={() => setDirty(true)}
        onSubmit={submit}
      >
        <fieldset disabled={busy}>
          <label>
            {t('Название')}
            <input name="title" required placeholder={t('Например: Утро у моря')} />
          </label>
          <label>
            {t('Описание картины')}
            <textarea
              name="description"
              rows={5}
              placeholder={t(
                'Например: Вечерний свет на воде. Работа написана с натуры на берегу моря.',
              )}
            />
          </label>
          <p className="studio-hint">
            {t(
              'Текст появится на странице картины. Для русского и английского языков он заполняется отдельно.',
            )}
          </p>
          <label>
            {t('Изображения · от 1 до 10')}
            <input
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />
          </label>
          <p className="studio-hint">
            {t('Первое изображение станет обложкой. JPG, PNG или WebP, до 4 МБ каждый.')}
          </p>
          <DimensionFields />
          <ArtworkPriceFields />
          <p className="studio-hint">
            {t('Обе цены необязательны. Если цена не заполнена, на сайте она не показывается.')}
          </p>
          <Priority />
          <BoardSize value={3} />
          <button className="studio-button" type="submit" disabled={busy}>
            {busy ? t('Создаём галерею…') : t('Создать черновик')}
          </button>
        </fieldset>
        {error && (
          <p className="studio-error" role="alert">
            {t(error)}
          </p>
        )}
      </form>
    </>
  )
}
