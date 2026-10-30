'use client'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { requestSummary } from '@/lib/studio-admin'
import { useAdminLocale, useAdminText } from './studio-locale'
export const RequestDetails: JSONFieldClientComponent = ({ path, field }) => {
  const t = useAdminText()
  const locale = useAdminLocale()
  const { value } = useField<Record<string, unknown> | null>({ path })
  const data = value || {}
  const quote =
    data.quote && typeof data.quote === 'object' ? (data.quote as Record<string, unknown>) : null
  const rows = requestSummary(data, locale)
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
          <p style={{ margin: 0 }}>{t('Это общий вопрос. Текст и контакт находятся выше.')}</p>
        )}
        {typeof data.referenceLink === 'string' && /^https?:\/\//.test(data.referenceLink) && (
          <p>
            <a href={data.referenceLink} target="_blank" rel="noreferrer">
              {t('Открыть ссылку на референс ↗')}
            </a>
          </p>
        )}
        {quote?.demo === true && (
          <p style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
            {t('В заявке использованы демонстрационные расценки.')}
          </p>
        )}
      </div>
    </div>
  )
}
