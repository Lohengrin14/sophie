'use client'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

const currencies = [
  { value: 'RUB', label: '₽ Российский рубль' },
  { value: 'USD', label: '$ Доллар США' },
  { value: 'EUR', label: '€ Евро' },
]

export const CurrencyField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, disabled } = useField<string>({ path })
  const current = value || ''
  return (
    <div className="field-type text">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError path={path} showError={showError} />
        <select
          id={`field-${path}`}
          name={path}
          value={current}
          disabled={Boolean(disabled || readOnly)}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={showError}
          aria-describedby={`field-description-${path}`}
          style={{
            width: '100%',
            minHeight: 44,
            padding: '10px 12px',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 4,
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-text)',
            font: 'inherit',
          }}
        >
          {!current && <option value="">Выберите валюту</option>}
          {current && !currencies.some((item) => item.value === current) && (
            <option value={current}>{current} — текущая валюта</option>
          )}
          {currencies.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <FieldDescription path={path} description={field.admin?.description} />
      </div>
    </div>
  )
}
