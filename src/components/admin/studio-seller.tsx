'use client'
import type { Studio } from '@/payload-types'
import { text } from '@/lib/i18n'
import { SaveBox } from './studio-controls'
export function SellerSettings({
  artist,
  locale,
  onSave,
}: {
  artist: Studio
  locale: 'ru' | 'en'
  onSave: (data: unknown) => Promise<void>
}) {
  const l = (ru: string, en: string) => text(locale, ru, en)
  const fields = [
    ['sellerName', l('Продавец: ФИО или наименование', 'Seller name')],
    ['sellerCountry', l('Страна продавца', 'Seller country')],
    ['sellerTaxId', l('ИНН / налоговый номер', 'Tax ID')],
    ['sellerRegistration', l('ОГРН / ОГРНИП / регистрационный номер', 'Registration number')],
    ['sellerAddress', l('Адрес продавца', 'Seller address')],
    ['sellerEmail', l('Email для обращений', 'Contact email')],
    ['sellerPhone', l('Телефон продавца', 'Seller phone')],
  ] as const
  return (
    <>
      <SaveBox
        title={l('Покупка в один переход', 'Direct purchase contact')}
        help={l(
          'Кнопка «Купить» открывает выбранный контакт. Заполните его в блоке «Имя и контакты».',
          'The Buy button opens this contact. Fill it in under Name and contacts.',
        )}
        onSave={(data) => onSave({ purchaseChannel: data.get('purchaseChannel') })}
      >
        <label>
          {l('Канал для покупки', 'Purchase channel')}
          <select name="purchaseChannel" defaultValue={artist.purchaseChannel || 'auto'}>
            <option value="auto">
              {l(
                'Автоматически: Telegram → Instagram → email',
                'Automatic: Telegram → Instagram → email',
              )}
            </option>
            <option value="telegram">Telegram</option>
            <option value="instagram">Instagram</option>
            <option value="email">Email</option>
          </select>
        </label>
      </SaveBox>
      <SaveBox
        title={l('Реквизиты и условия', 'Seller details & terms')}
        help={l(
          'Публичные данные в футтере. Заполняйте по стране и статусу продавца: одного ИНН может быть недостаточно. Пустые поля не показываются.',
          'Public footer information. Fill in according to seller country and legal status. A tax ID alone may not be enough. Empty fields are hidden.',
        )}
        onSave={(data) =>
          onSave(
            Object.fromEntries(
              [...fields.map(([key]) => key), 'sellerStatus', 'sellerTerms'].map((key) => [
                key,
                String(data.get(key) || '').trim() || null,
              ]),
            ),
          )
        }
      >
        <label>
          {l('Статус продавца', 'Seller status')}
          <select name="sellerStatus" defaultValue={artist.sellerStatus || ''}>
            <option value="">{l('Не указан', 'Not specified')}</option>
            {[
              ['individual', l('Физическое лицо', 'Individual')],
              ['self-employed', l('Самозанятый', 'Self-employed')],
              ['entrepreneur', l('ИП', 'Sole proprietor')],
              ['company', l('Компания', 'Company')],
              ['other', l('Другой статус', 'Other')],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type={key === 'sellerEmail' ? 'email' : 'text'}
              defaultValue={String(artist[key] || '')}
            />
          </label>
        ))}
        <label>
          {l('Условия покупки, доставки и обращений', 'Purchase, delivery and enquiries')}
          <textarea name="sellerTerms" rows={5} defaultValue={artist.sellerTerms || ''} />
        </label>
      </SaveBox>
    </>
  )
}
