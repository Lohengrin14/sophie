'use client'
import { useEffect, useState } from 'react'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent, DefaultCellComponentProps } from 'payload'
import { formatPriceInput, parsePriceInput, validStoredPrice } from '@/lib/admin-helpers'

export const MoneyField: NumberFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, disabled } = useField<number | null>({
    path,
    validate: validStoredPrice,
  })
  const [draft, setDraft] = useState(() => formatPriceInput(value))
  useEffect(() => {
    setDraft((current) =>
      parsePriceInput(current) === (value ?? null) ? current : formatPriceInput(value),
    )
  }, [value])
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
            typeof field.admin?.placeholder === 'string' ? field.admin.placeholder : 'Например: 650'
          }
          aria-invalid={showError}
          aria-describedby={`field-description-${path.replace(/\./g, '__')}`}
          onChange={(event) => {
            setDraft(event.target.value)
            setValue(parsePriceInput(event.target.value))
          }}
        />
        <FieldDescription path={path} description={field.admin?.description} />
      </div>
    </div>
  )
}
export function MoneyCell({ cellData, rowData }: DefaultCellComponentProps) {
  const currency = typeof rowData?.currency === 'string' ? rowData.currency : 'EUR'
  return typeof cellData === 'number' ? (
    <span>
      {new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(cellData / 100)}
    </span>
  ) : (
    <span>—</span>
  )
}
