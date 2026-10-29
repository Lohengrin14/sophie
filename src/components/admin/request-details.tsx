'use client'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
const words: Record<string, string> = {
  portrait: 'Портрет',
  landscape: 'Пейзаж',
  'still-life': 'Натюрморт',
  other: 'Другая идея',
  oil: 'Масло, холст',
  acrylic: 'Акрил, холст',
  unsure: 'Нужна помощь с выбором',
  custom: 'Свой размер',
}
const price = (amount: unknown, currency: unknown) =>
  typeof amount === 'number' && typeof currency === 'string'
    ? new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(amount / 100)
    : '—'

export const RequestDetails: JSONFieldClientComponent = ({ path, field }) => {
  const { value } = useField<Record<string, unknown> | null>({ path })
  const data = value || {}
  const quote =
    data.quote && typeof data.quote === 'object' ? (data.quote as Record<string, unknown>) : null
  const rows: [string, string][] = []
  if (data.title)
    rows.push(
      ['Картина', String(data.title)],
      ['Цена на момент заявки', price(data.priceMinor, data.currency)],
    )
  if (data.subject) rows.push(['Сюжет', words[String(data.subject)] || String(data.subject)])
  if (data.medium) rows.push(['Техника', words[String(data.medium)] || String(data.medium)])
  if (data.size)
    rows.push([
      'Размер',
      data.size === 'custom'
        ? `${data.customWidth} × ${data.customHeight} см`
        : words[String(data.size)] || `${String(data.size).replace('x', ' × ')} см`,
    ])
  if ('quote' in data)
    rows.push([
      'Предварительная цена',
      quote
        ? `${price(quote.minPrice, quote.currency)} — ${price(quote.maxPrice, quote.currency)}`
        : 'Нужно уточнить лично',
    ])
  if (quote) rows.push(['Готовность', `${quote.minDays}–${quote.maxDays} дней, включая просушку`])
  return (
    <div className="field-type">
      <FieldLabel label={field.label} path={path} />
      <div
        style={{
          padding: '16px 20px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
        }}
      >
        {rows.length ? (
          <dl style={{ margin: 0 }}>
            {rows.map(([label, content]) => (
              <div
                key={label}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', padding: '7px 0' }}
              >
                <dt style={{ color: 'var(--theme-elevation-600)', minWidth: 170 }}>{label}</dt>
                <dd style={{ margin: 0 }}>{content}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p style={{ margin: 0 }}>Это общий вопрос. Текст и контакт находятся выше.</p>
        )}
        {typeof data.referenceLink === 'string' && /^https?:\/\//.test(data.referenceLink) && (
          <p>
            <a href={data.referenceLink} target="_blank" rel="noreferrer">
              Открыть ссылку на референс ↗
            </a>
          </p>
        )}
        {quote?.demo === true && (
          <p style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
            В заявке использованы демонстрационные расценки.
          </p>
        )}
      </div>
    </div>
  )
}
