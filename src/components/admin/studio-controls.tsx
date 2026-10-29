'use client'
import { useEffect, useState, type ReactNode, type FormEvent } from 'react'
import { Check, LoaderCircle, Save } from 'lucide-react'
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
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!dirty && !changed) return
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [dirty, changed])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await onSave(data)
      setDirty(false)
      setMessage('Сохранено')
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
      <fieldset disabled={busy}>{children}</fieldset>
      <div className="studio-savebar">
        <span role="status">
          {busy
            ? 'Сохраняем…'
            : dirty || changed
              ? 'Есть несохранённые изменения'
              : message && (
                  <>
                    <Check size={16} />
                    {message}
                  </>
                )}
        </span>
        <button className="studio-button" type="submit" disabled={busy || !(dirty || changed)}>
          {busy ? <LoaderCircle size={16} /> : <Save size={16} />} Сохранить
        </button>
      </div>
      {error && (
        <p className="studio-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

export function DimensionFields({ width = 40, height = 40 }: { width?: number; height?: number }) {
  const [size, setSize] = useState({ width, height })
  const [preset, setPreset] = useState(
    canvasPresets.some(([key]) => key === `${width}x${height}`) ? `${width}x${height}` : 'custom',
  )
  return (
    <>
      <label>
        Размер холста
        <select
          value={preset}
          onChange={(event) => {
            const value = event.target.value
            setPreset(value)
            if (value !== 'custom') {
              const [width, height] = value.split('x').map(Number)
              setSize({ width, height })
            }
          }}
        >
          {canvasPresets.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
          <option value="custom">Другой размер — ввести вручную</option>
        </select>
      </label>
      <div className="studio-form-row">
        <label>
          Ширина, см
          <input
            name="width"
            type="number"
            min="1"
            step="0.1"
            required
            value={size.width}
            onChange={(event) => {
              setPreset('custom')
              setSize({ ...size, width: Number(event.target.value) })
            }}
          />
        </label>
        <label>
          Высота, см
          <input
            name="height"
            type="number"
            min="1"
            step="0.1"
            required
            value={size.height}
            onChange={(event) => {
              setPreset('custom')
              setSize({ ...size, height: Number(event.target.value) })
            }}
          />
        </label>
      </div>
      <p className="studio-hint">
        Ширина × высота без рамы. 60 × 40 — горизонтально, 40 × 60 — вертикально.
      </p>
    </>
  )
}

export function CurrencySelect({ value = 'EUR' }: { value?: string }) {
  return (
    <label>
      Валюта
      <select name="currency" defaultValue={value}>
        {!['RUB', 'USD', 'EUR'].includes(value) && <option value={value}>{value}</option>}
        <option value="RUB">₽ Российский рубль</option>
        <option value="USD">$ Доллар США</option>
        <option value="EUR">€ Евро</option>
      </select>
    </label>
  )
}

export function BoardSize({ value }: { value: number }) {
  const [size, setSize] = useState(value)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched) setSize(value)
    if (value === size) setTouched(false)
  }, [value, touched, size])
  return (
    <label>
      Размер на главной: <strong>{size} из 5</strong>
      <input
        name="displaySize"
        type="range"
        min="1"
        max="5"
        step="1"
        value={size}
        onChange={(event) => {
          setSize(Number(event.target.value))
          setTouched(true)
        }}
      />
      <span className="studio-range-labels">
        <span>1 · Небольшой</span>
        <span>5 · Крупный</span>
      </span>
      <span className="studio-scale-preview" aria-hidden="true">
        <i style={{ width: `${size * 12 + 24}%`, height: `${size * 12 + 24}%` }} />
      </span>
      <span className="studio-hint">
        Меняет только место в мозаике. Реальный размер и пропорции холста сохраняются.
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
  return (
    <div className="studio-pagination">
      <span>Всего: {total}</span>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Назад
        </button>
        <span>
          {page} / {Math.max(1, pages)}
        </span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Дальше →
        </button>
      </div>
    </div>
  )
}
