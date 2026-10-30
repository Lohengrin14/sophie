'use client'
import { useAdminText, useAdminLocale } from './studio-locale'
import { useEffect, useState, type ReactNode, type FormEvent } from 'react'
import { Check, LoaderCircle, Save } from 'lucide-react'
import { useAuth } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import { can, type Section } from '@/lib/studio-access'
import type { User, Artwork } from '@/payload-types'
import { techniques, surfaces, paperSizes, supportsPaperFormat } from '@/lib/artwork-materials'
import { boardSize } from '@/lib/canvas-size'
import { canvasPresets } from '@/lib/studio-admin'

export function SaveBox({
  title,
  help,
  children,
  onSave,
  changed = false,
}: {
  title: string
  help?: string
  children: ReactNode
  changed?: boolean
  onSave: (data: FormData) => Promise<void>
}) {
  const t = useAdminText()

  const { user } = useAuth<User>()
  const section = (useSearchParams().get('tab') || 'gallery') as Section
  const editable = can(user, section, 'edit')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await onSave(data)
      setDirty(false)
      setMessage(t('Сохранено'))
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      data-dirty={dirty || changed}
      className="studio-card studio-savebox"
      onSubmit={submit}
      onChange={() => {
        setDirty(true)
        setMessage('')
      }}
    >
      <div className="studio-card-heading">
        <h2>{title}</h2>
        {help && <p>{help}</p>}
      </div>
      <fieldset disabled={busy || !editable}>{children}</fieldset>
      <div className="studio-savebar">
        <span role="status">
          {busy
            ? t('Сохраняем…')
            : dirty || changed
              ? t('Есть несохранённые изменения')
              : message && (
                  <>
                    <Check size={16} />
                    {message}
                  </>
                )}
        </span>
        <button
          className="studio-button"
          type="submit"
          disabled={busy || !editable || !(dirty || changed)}
        >
          {busy ? <LoaderCircle size={16} /> : <Save size={16} />} {t('Сохранить')}
        </button>
      </div>
      {error && (
        <p className="studio-error" role="alert">
          {t(error)}
        </p>
      )}
    </form>
  )
}

export function ArtworkMaterialFields({ work }: { work?: Partial<Artwork> }) {
  const t = useAdminText()
  const locale = useAdminLocale()
  const [kind, setKind] = useState(work?.workKind || 'physical')
  const [medium, setMedium] = useState(work?.medium === 'digital' ? 'oil' : work?.medium || 'oil')
  const [surface, setSurface] = useState(work?.surface || 'canvas')
  const [physicalSize, setPhysicalSize] = useState({
    width: work?.workKind === 'digital' ? 40 : (work?.width ?? 40),
    height: work?.workKind === 'digital' ? 40 : (work?.height ?? 40),
  })
  const image = work?.image && typeof work.image === 'object' ? work.image : null
  const [digitalSize, setDigitalSize] = useState({
    width: work?.workKind === 'digital' ? (work.width ?? 2400) : (image?.width ?? 2400),
    height: work?.workKind === 'digital' ? (work.height ?? 2400) : (image?.height ?? 2400),
  })
  const [preset, setPreset] = useState<string>(() =>
    supportsPaperFormat(work?.surface)
      ? work?.paperFormat || 'custom'
      : canvasPresets.some(([key]) => key === `${work?.width ?? 40}x${work?.height ?? 40}`)
        ? `${work?.width ?? 40}x${work?.height ?? 40}`
        : 'custom',
  )
  const digital = kind === 'digital'
  const paper = supportsPaperFormat(surface)
  const size = digital ? digitalSize : physicalSize
  const setSize = digital ? setDigitalSize : setPhysicalSize
  return (
    <>
      <label>
        {t('Вид работы')}
        <select
          name="workKind"
          value={kind}
          onChange={(event) => setKind(event.target.value as 'physical' | 'digital')}
        >
          <option value="physical">{t('Физическая работа')}</option>
          <option value="digital">{t('Цифровая работа')}</option>
        </select>
      </label>
      {!digital ? (
        <>
          <div className="studio-form-row">
            <label>
              {t('Краски / техника')}
              <select
                name="medium"
                value={medium}
                onChange={(event) => setMedium(event.target.value as typeof medium)}
              >
                {techniques.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('Основа')}
              <select
                name="surface"
                value={surface}
                onChange={(event) => {
                  setSurface(event.target.value as typeof surface)
                  setPreset('custom')
                }}
              >
                {surfaces.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item[locale]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            {paper ? t('Формат бумаги') : t('Размер основы')}
            <select
              value={preset}
              onChange={(event) => {
                const value = event.target.value
                setPreset(value)
                if (value === 'custom') return
                const sheet = paperSizes.find((item) => item.format === value)
                if (sheet) setPhysicalSize({ width: sheet.width, height: sheet.height })
                else {
                  const [width, height] = value.split('x').map(Number)
                  setPhysicalSize({ width, height })
                }
              }}
            >
              {paper
                ? paperSizes.map((item) => (
                    <option key={item.format} value={item.format}>
                      {item.format} · {item.width} × {item.height} {t('см')}
                    </option>
                  ))
                : canvasPresets.map(([key, label]) => (
                    <option key={key} value={key}>
                      {t(label)}
                    </option>
                  ))}
              <option value="custom">{t('Другой размер — ввести вручную')}</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <input type="hidden" name="medium" value="digital" />
          <input type="hidden" name="surface" value="" />
          <p className="studio-hint">
            {t('Размер цифровой работы указывается в пикселях, без холста и сантиметров.')}
          </p>
        </>
      )}
      <input
        type="hidden"
        name="paperFormat"
        value={!digital && paper && preset !== 'custom' ? preset : ''}
      />
      <div className="studio-form-row">
        <label>
          {digital ? t('Ширина, px') : t('Ширина, см')}
          <input
            name="width"
            type="number"
            min="1"
            step={digital ? '1' : '0.1'}
            required
            value={size.width}
            onChange={(event) => {
              if (!digital) setPreset('custom')
              setSize({ ...size, width: Number(event.target.value) })
            }}
          />
        </label>
        <label>
          {digital ? t('Высота, px') : t('Высота, см')}
          <input
            name="height"
            type="number"
            min="1"
            step={digital ? '1' : '0.1'}
            required
            value={size.height}
            onChange={(event) => {
              if (!digital) setPreset('custom')
              setSize({ ...size, height: Number(event.target.value) })
            }}
          />
        </label>
      </div>
      <label className="studio-check">
        <input
          type="checkbox"
          checked={size.width > size.height}
          disabled={size.width === size.height}
          onChange={() => setSize({ width: size.height, height: size.width })}
        />
        {t('Горизонтальная ориентация')}
      </label>
      {!digital && (
        <p className="studio-hint">
          {t('Размер без рамы. Для бумаги и картона можно выбрать A1–A5 или ввести свой размер.')}
        </p>
      )}
    </>
  )
}

export function CurrencySelect({ value = 'EUR' }: { value?: string }) {
  const t = useAdminText()

  return (
    <label>
      {t('Валюта')}
      <select name="currency" defaultValue={value}>
        {!['RUB', 'USD', 'EUR'].includes(value) && <option value={value}>{value}</option>}
        <option value="RUB">{t('₽ Российский рубль')}</option>
        <option value="USD">{t('$ Доллар США')}</option>
        <option value="EUR">{t('€ Евро')}</option>
      </select>
    </label>
  )
}

export function BoardSize({ value }: { value: number }) {
  const t = useAdminText()

  const [size, setSize] = useState(value)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched) setSize(value)
    if (value === size) setTouched(false)
  }, [value, touched, size])
  return (
    <label>
      {t('Размер на главной:')}
      <strong>
        {boardSize(size).scale.toLocaleString(undefined, { maximumFractionDigits: 2 })}× · {size} /
        10
      </strong>
      <input
        name="displaySize"
        type="range"
        min="1"
        max="10"
        step="1"
        value={size}
        onChange={(event) => {
          setSize(Number(event.target.value))
          setTouched(true)
        }}
      />
      <span className="studio-range-labels">
        <span>{t('1× · Небольшой')}</span>
        <span>{t('4× · Крупный')}</span>
      </span>
      <span className="studio-scale-preview" aria-hidden="true">
        <i style={{ width: `${size * 7 + 20}%`, height: `${size * 7 + 20}%` }} />
      </span>
      <span className="studio-hint">
        {t('Меняет только место в мозаике. Реальный размер и пропорции холста сохраняются.')}
      </span>
    </label>
  )
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number
  pages: number
  total: number
  onPage: (page: number) => void
}) {
  const t = useAdminText()

  return (
    <div className="studio-pagination">
      <span>
        {t('Всего:')}
        {total}
      </span>
      <div>
        <button
          data-studio-navigation
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t('← Назад')}
        </button>
        <span>
          {page} / {Math.max(1, pages)}
        </span>
        <button
          data-studio-navigation
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          {t('Дальше →')}
        </button>
      </div>
    </div>
  )
}

export function Priority({ value = 25 }: { value?: number | null }) {
  const t = useAdminText()

  const [priority, setPriority] = useState(Math.max(1, Math.min(50, value || 25)))
  return (
    <label>
      {t('Порядок на главной:')}
      <strong>{priority}</strong>
      <input
        name="sortOrder"
        type="range"
        min="1"
        max="50"
        step="1"
        value={priority}
        onChange={(event) => setPriority(Number(event.target.value))}
      />
      <span className="studio-range-labels">
        <span>{t('1 — первое место')}</span>
        <span>{t('50 — последнее место')}</span>
      </span>
      <span className="studio-hint">
        {t('При равном приоритете сначала крупные работы, затем по названию.')}
      </span>
    </label>
  )
}
