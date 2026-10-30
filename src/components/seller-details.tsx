import type { Brand } from '@/lib/brand'
import { text, type Locale } from '@/lib/i18n'
export function SellerDetails({ seller, locale }: { seller: Brand['seller']; locale: Locale }) {
  const status: Record<string, string> = {
    individual: text(locale, 'Физическое лицо', 'Individual'),
    'self-employed': text(locale, 'Самозанятый', 'Self-employed'),
    entrepreneur: text(locale, 'ИП', 'Sole proprietor'),
    company: text(locale, 'Компания', 'Company'),
    other: text(locale, 'Другой статус', 'Other'),
  }
  const rows = [
    [text(locale, 'Продавец', 'Seller'), seller.name],
    [text(locale, 'Статус', 'Status'), status[seller.status]],
    [text(locale, 'Страна', 'Country'), seller.country],
    [text(locale, 'ИНН / налоговый номер', 'Tax ID'), seller.taxId],
    [text(locale, 'Регистрационный номер', 'Registration number'), seller.registration],
    [text(locale, 'Адрес', 'Address'), seller.address],
    ['Email', seller.email],
    [text(locale, 'Телефон', 'Phone'), seller.phone],
  ].filter(([, value]) => Boolean(value))
  if (!rows.length && !seller.terms) return null
  return (
    <details className="seller-details">
      <summary>{text(locale, 'Реквизиты и условия', 'Seller details & terms')}</summary>
      <div className="seller-details-body">
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {seller.terms && <p>{seller.terms}</p>}
      </div>
    </details>
  )
}
