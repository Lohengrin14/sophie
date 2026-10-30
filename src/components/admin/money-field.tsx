'use client'
import { useAdminLocale, useAdminText } from './studio-locale'
import { useEffect, useRef, useState } from 'react'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent, DefaultCellComponentProps } from 'payload'
import { formatPriceInput, parsePriceInput, validStoredPrice } from '@/lib/admin-helpers'

export const MoneyField: NumberFieldClientComponent = ({ field, path, readOnly }) => {
  const t = useAdminText()
  const locale = useAdminLocale()
  const invalidInput = useRef(false)
  const { value, setValue, showError, disabled } = useField<number | null>({
    path,
    validate: (value: unknown) =>
      invalidInput.current
        ? validStoredPrice(NaN)
        : (!field.required && value == null) || validStoredPrice(value),
  })
  const [draft, setDraft] = useState(() => formatPriceInput(value))
  useEffect(() => {
    setDraft((current) =>
      parsePriceInput(current) === (value ?? null) ? current : formatPriceInput(value),
    )
  }, [value])
  const placeholder = field.admin?.placeholder as string | Record<string, string> | undefined
  const inputID = `field-${path.replace(/\./g, '__')}`
  return (
    <div className={`field-type number ${showError ? 'error' : ''}`}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <input
          id={inputID}
          name={path}
          type="text"
          inputMode="decimal"
          value={draft}
          disabled={Boolean(readOnly || disabled)}
          placeholder={
            typeof placeholder === 'string'
              ? t(placeholder)
              : placeholder?.[locale] || t('Например: 650')
          }
          aria-invalid={showError}
          aria-describedby={`field-description-${path.replace(/\./g, '__')}`}
          onChange={(event) => {
            setDraft(event.target.value)
            const amount = parsePriceInput(event.target.value)
            invalidInput.current = Boolean(event.target.value.trim()) && amount === null
            setValue(amount)
          }}
        />
        <FieldDescription path={path} description={field.admin?.description} />
      </div>
    </div>
  )
}
export function MoneyCell({ cellData, rowData, field }: DefaultCellComponentProps) {
  const locale = useAdminLocale()
  const name = 'name' in field ? field.name : ''
  const currency =
    name === 'priceRubMinor'
      ? 'RUB'
      : name === 'priceUsdMinor'
        ? 'USD'
        : typeof rowData?.currency === 'string'
          ? rowData.currency
          : 'EUR'
  return typeof cellData === 'number' ? (
    <span>
      {new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(cellData / 100)}
    </span>
  ) : (
    <span>—</span>
  )
}
