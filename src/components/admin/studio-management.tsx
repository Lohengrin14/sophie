'use client'
import { useAdminText } from './studio-locale'
import { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'
import type { User, QuoteRule } from '@/payload-types'
import { can, isAdmin, sections, sectionNames, type StudioUser } from '@/lib/studio-access'
import { formatPriceInput, parsePriceInput } from '@/lib/admin-helpers'
import { SaveBox, CurrencySelect } from './studio-controls'
import { studioAPI, jsonRequest, type Page } from './studio-api'
import { useAdminLocale } from './studio-locale'

function Switch({
  name,
  label,
  checked = false,
  disabled = false,
  onChange,
}: {
  name: string
  label: string
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  const t = useAdminText()

  return (
    <label className="studio-switch">
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={onChange ? undefined : checked}
        checked={onChange ? checked : undefined}
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
      />
      <span>{t(label)}</span>
    </label>
  )
}
export function StaffPanel() {
  const t = useAdminText()

  const { user } = useAuth<User>()
  const [rows, setRows] = useState<User[]>([])
  const [selected, setSelected] = useState<User | 'new' | null>(null)
  const [error, setError] = useState('')
  const load = () =>
    studioAPI<Page<User>>('/api/users?limit=1000&sort=email')
      .then((result) => setRows(result.docs))
      .catch((error) => setError(error.message))
  useEffect(() => {
    void load()
  }, [])
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <h1>{t('Сотрудники')}</h1>
          <p>{t('Учётные записи и доступ к разделам мастерской.')}</p>
        </div>
        {can(user, 'users', 'edit') && (
          <button
            data-studio-navigation
            className="studio-button"
            onClick={() => setSelected('new')}
          >
            {t('Добавить сотрудника')}
          </button>
        )}
      </div>
      {error && <p role="alert">{t(error)}</p>}
      {selected ? (
        <>
          <button className="studio-back" onClick={() => setSelected(null)}>
            {t('← Все сотрудники')}
          </button>
          <StaffEditor
            key={selected === 'new' ? 'new' : selected.id}
            value={selected}
            admin={isAdmin(user)}
            onSaved={async (doc) => {
              setSelected(doc)
              await load()
            }}
          />
        </>
      ) : (
        <div className="studio-card studio-table-card">
          <div className="studio-table-scroll">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>{t('Имя')}</th>
                  <th>Email</th>
                  <th>{t('Роль')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button className="studio-title-button" onClick={() => setSelected(row)}>
                        {row.name || row.email}
                      </button>
                    </td>
                    <td>{row.email}</td>
                    <td>{isAdmin(row) ? t('Администратор') : t('Сотрудник')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
function StaffEditor({
  value,
  admin,
  onSaved,
}: {
  value: User | 'new'
  admin: boolean
  onSaved: (doc: User) => Promise<void>
}) {
  const t = useAdminText()

  const original = value === 'new' ? null : value
  const [role, setRole] = useState(isAdmin(original) ? 'admin' : 'staff')
  const [permissions, setPermissions] = useState<NonNullable<StudioUser['permissions']>>(
    original?.permissions || {},
  )
  return (
    <SaveBox
      title={original ? t('Учётная запись') : t('Новый сотрудник')}
      onSave={async (form) => {
        const data: Record<string, unknown> = {
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
        }
        if (form.get('password')) data.password = form.get('password')
        if (admin) {
          data.role = role
          data.permissions = permissions
        }
        const result = await studioAPI<{ doc: User }>(
          `/api/users${original ? `/${original.id}` : ''}`,
          jsonRequest(original ? 'PATCH' : 'POST', data),
        )
        await onSaved(result.doc)
      }}
    >
      <div className="studio-form-row">
        <label>
          {t('Имя')}
          <input name="name" defaultValue={original?.name || ''} />
        </label>
        <label>
          Email
          <input name="email" type="email" required defaultValue={original?.email || ''} />
        </label>
      </div>
      <label>
        {t('Пароль')}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required={!original}
          placeholder={
            original ? t('Оставьте пустым, чтобы сохранить текущий') : t('Не менее 12 символов')
          }
        />
      </label>
      {admin && (
        <label>
          {t('Роль')}
          <select name="role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="staff">{t('Сотрудник')}</option>
            <option value="admin">{t('Администратор')}</option>
          </select>
        </label>
      )}
      {role === 'admin' ? (
        <p className="studio-hint">{t('Администратор видит все разделы и может изменять всё.')}</p>
      ) : (
        <>
          <p className="studio-hint">
            {t('Изменение включает чтение. Назначать доступы может только администратор.')}
          </p>
          <div className="studio-permissions">
            {sections.map((section) => (
              <div key={section}>
                <strong>{t(sectionNames[section])}</strong>
                <Switch
                  name={`${section}-read`}
                  label={t('Чтение')}
                  checked={Boolean(permissions[section]?.read || permissions[section]?.edit)}
                  disabled={!admin}
                  onChange={(read) =>
                    setPermissions({
                      ...permissions,
                      [section]: { read, edit: read && permissions[section]?.edit },
                    })
                  }
                />
                <Switch
                  name={`${section}-edit`}
                  label={t('Изменение')}
                  checked={Boolean(permissions[section]?.edit)}
                  disabled={!admin}
                  onChange={(edit) =>
                    setPermissions({
                      ...permissions,
                      [section]: { read: edit || permissions[section]?.read, edit },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </SaveBox>
  )
}

export function QuotesPanel() {
  const t = useAdminText()

  const locale = useAdminLocale()
  const { user } = useAuth<User>()
  const [rows, setRows] = useState<QuoteRule[]>([])
  const [selected, setSelected] = useState<QuoteRule | 'new' | null>(null)
  const [error, setError] = useState('')
  const load = () =>
    studioAPI<Page<QuoteRule>>(`/api/quote-rules?limit=1000&sort=label&locale=${locale}`)
      .then((result) => setRows(result.docs))
      .catch((error) => setError(error.message))
  useEffect(() => {
    void load()
  }, [locale])
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <h1>{t('Цены и сроки')}</h1>
          <p>
            {t(
              'Примерная стоимость и время работы для формы заказа. Окончательные условия вы обсуждаете лично.',
            )}
          </p>
        </div>
        {can(user, 'quotes', 'edit') && (
          <button
            data-studio-navigation
            className="studio-button"
            onClick={() => setSelected('new')}
          >
            {t('Добавить расценку')}
          </button>
        )}
      </div>
      {error && <p role="alert">{t(error)}</p>}
      {selected ? (
        <>
          <button className="studio-back" onClick={() => setSelected(null)}>
            {t('← Все расценки')}
          </button>
          <QuoteEditor
            key={selected === 'new' ? 'new' : selected.id}
            value={selected}
            onSaved={async (doc) => {
              setSelected(doc)
              await load()
            }}
          />
        </>
      ) : (
        <div className="studio-card studio-table-card">
          <div className="studio-table-scroll">
            <table className="studio-table">
              <thead>
                <tr>
                  <th>{t('Название')}</th>
                  <th>{t('Цена')}</th>
                  <th>{t('Срок, дней')}</th>
                  <th>{t('Статус')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button className="studio-title-button" onClick={() => setSelected(row)}>
                        {row.label}
                      </button>
                    </td>
                    <td>
                      {formatPriceInput(row.minPrice)} – {formatPriceInput(row.maxPrice)}{' '}
                      {row.currency}
                    </td>
                    <td>
                      {row.minDays} – {row.maxDays}
                    </td>
                    <td>{row.active ? t('Активна') : t('Выключена')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
function QuoteEditor({
  value,
  onSaved,
}: {
  value: QuoteRule | 'new'
  onSaved: (doc: QuoteRule) => Promise<void>
}) {
  const t = useAdminText()

  const row = value === 'new' ? null : value
  return (
    <SaveBox
      title={row ? t('Расценка заказа') : t('Новая расценка')}
      help={t('Одна расценка — одно сочетание сюжета, техники и размера.')}
      onSave={async (form) => {
        const minPrice = parsePriceInput(String(form.get('minPrice'))),
          maxPrice = parsePriceInput(String(form.get('maxPrice')))
        if (minPrice == null || maxPrice == null || maxPrice < minPrice)
          throw new Error(t('Проверьте диапазон цены.'))
        const minDays = Number(form.get('minDays')),
          maxDays = Number(form.get('maxDays'))
        if (maxDays < minDays) throw new Error(t('Срок «до» не может быть меньше срока «от».'))
        const data = {
          ...Object.fromEntries(
            ['label', 'subject', 'medium', 'size', 'currency'].map((key) => [key, form.get(key)]),
          ),
          minPrice,
          maxPrice,
          minDays,
          maxDays,
          active: form.has('active'),
          demo: form.has('demo'),
        }
        const result = await studioAPI<{ doc: QuoteRule }>(
          `/api/quote-rules${row ? `/${row.id}` : ''}`,
          jsonRequest(row ? 'PATCH' : 'POST', data),
        )
        await onSaved(result.doc)
      }}
    >
      <label>
        {t('Название')}
        <input
          name="label"
          required
          defaultValue={row?.label || ''}
          placeholder={t('Например: Портрет маслом, 40 × 40')}
        />
      </label>
      <div className="studio-form-row">
        <label>
          {t('Сюжет')}
          <select name="subject" defaultValue={row?.subject || 'portrait'}>
            <option value="portrait">{t('Портрет')}</option>
            <option value="landscape">{t('Пейзаж')}</option>
            <option value="still-life">{t('Натюрморт')}</option>
          </select>
        </label>
        <label>
          {t('Техника')}
          <select name="medium" defaultValue={row?.medium || 'oil'}>
            <option value="oil">{t('Масло, холст')}</option>
            <option value="acrylic">{t('Акрил, холст')}</option>
          </select>
        </label>
      </div>
      <label>
        {t('Размер')}
        <select name="size" defaultValue={row?.size || '40x40'}>
          {['30x40', '40x40', '50x70'].map((size) => (
            <option key={size} value={size}>
              {size.replace('x', ' × ')} {t('см')}
            </option>
          ))}
        </select>
      </label>
      <div className="studio-form-row">
        <label>
          {t('Цена от')}
          <input
            name="minPrice"
            inputMode="decimal"
            required
            defaultValue={row ? formatPriceInput(row.minPrice) : ''}
          />
        </label>
        <label>
          {t('Цена до')}
          <input
            name="maxPrice"
            inputMode="decimal"
            required
            defaultValue={row ? formatPriceInput(row.maxPrice) : ''}
          />
        </label>
      </div>
      <CurrencySelect value={row?.currency} />
      <div className="studio-form-row">
        <label>
          {t('Готовность от, дней')}
          <input
            name="minDays"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={row?.minDays || 28}
          />
        </label>
        <label>
          {t('Готовность до, дней')}
          <input
            name="maxDays"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={row?.maxDays || 49}
          />
        </label>
      </div>
      <Switch
        name="active"
        label={t('Использовать в форме заказа')}
        checked={row?.active ?? true}
      />
      <Switch
        name="demo"
        label={t('Это пример, а не реальные расценки')}
        checked={row?.demo ?? false}
      />
    </SaveBox>
  )
}
