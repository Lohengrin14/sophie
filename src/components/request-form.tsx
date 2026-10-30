'use client'
import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { text, money, type Locale } from '@/lib/i18n'
import { ContactLinks } from './footer'
import type { Brand } from '@/lib/brand'
import type { Quote } from '@/lib/requests'

type Props = {
  locale: Locale
  brand: Brand
  kind: 'commission' | 'purchase' | 'question'
  artworkId?: number
  commissionsOpen?: boolean
}
export function RequestForm({ locale, brand, kind, artworkId, commissionsOpen = true }: Props) {
  const id = useId()
  const [subject, setSubject] = useState('portrait'),
    [medium, setMedium] = useState('oil'),
    [size, setSize] = useState('40x40')
  const [channel, setChannel] = useState('email'),
    [quote, setQuote] = useState<Quote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(kind === 'commission'),
    [quoteError, setQuoteError] = useState(false),
    [revision, setRevision] = useState(0)
  const [step, setStep] = useState(kind === 'commission' ? 1 : 2),
    [sending, setSending] = useState(false),
    [error, setError] = useState(''),
    [reference, setReference] = useState('')
  const [files, setFiles] = useState<File[]>([]),
    [fileError, setFileError] = useState(''),
    [key, setKey] = useState('')
  useEffect(() => {
    setKey(crypto.randomUUID())
  }, [])
  useEffect(() => {
    if (kind !== 'commission') return
    const controller = new AbortController()
    setLoadingQuote(true)
    setQuoteError(false)
    fetch(`/api/estimate?${new URLSearchParams({ subject, medium, size })}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => setQuote(d.quote))
      .catch((e) => {
        if (e.name !== 'AbortError') setQuoteError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingQuote(false)
      })
    return () => controller.abort()
  }, [subject, medium, size, kind, revision])
  const errors: Record<string, string> = {
    invalid: text(
      locale,
      'Проверьте поля и контакт. Для мессенджера укажите имя пользователя.',
      'Check your details. For a messenger, enter a username.',
    ),
    files: text(
      locale,
      'До 3 изображений JPG, PNG или WebP, каждое до 5 МБ.',
      'Up to 3 JPG, PNG or WebP images, 5 MB each.',
    ),
    unavailable: text(
      locale,
      'Эта работа больше не доступна. Обновите страницу или напишите мне.',
      'This work is no longer available. Refresh the page or contact me.',
    ),
    closed: text(
      locale,
      'Приём новых заказов сейчас закрыт.',
      'New commissions are currently closed.',
    ),
    rate: text(
      locale,
      'Вы уже отправили несколько заявок. Попробуйте через 15 минут.',
      'You have sent several requests. Please try again in 15 minutes.',
    ),
    quoteChanged: text(
      locale,
      'Ориентир обновился. Проверьте новую оценку и отправьте ещё раз.',
      'The estimate has changed. Review it and submit again.',
    ),
    save: text(
      locale,
      'Не удалось сохранить заявку. Данные формы остались здесь — попробуйте ещё раз.',
      'Your request could not be saved. Your form is still here — please try again.',
    ),
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    if (step === 1) {
      setStep(2)
      return
    }
    if (fileError || (kind === 'commission' && (loadingQuote || quoteError))) return
    setSending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const data = {
      kind,
      locale,
      name: form.get('name') || '',
      channel,
      contact: form.get('contact'),
      message: form.get('message') || '',
      website: form.get('website') || '',
      consent: form.get('consent') === 'on',
      idempotencyKey: key,
      ...(kind === 'purchase' ? { artworkId } : {}),
      ...(kind === 'commission'
        ? {
            subject,
            medium,
            size,
            ...(size === 'custom'
              ? { customWidth: form.get('customWidth'), customHeight: form.get('customHeight') }
              : {}),
            referenceLink: form.get('referenceLink') || '',
            estimateToken: quote?.token || 'manual',
          }
        : {}),
    }
    const body = new FormData()
    body.set('data', JSON.stringify(data))
    files.forEach((file) => body.append('references', file))
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) {
        if (result.error === 'quoteChanged') {
          setRevision((r) => r + 1)
          setStep(1)
        }
        setError(errors[result.error] || errors.save)
        return
      }
      setReference(result.reference)
    } catch {
      setError(errors.save)
    } finally {
      setSending(false)
    }
  }
  if (reference)
    return (
      <div className="success-panel" role="status">
        <CheckCircle2 size={38} strokeWidth={1.2} />
        <p className="eyebrow">{reference}</p>
        <h2>{text(locale, 'Заявка отправлена', 'Request submitted')}</h2>
        <p>
          {text(
            locale,
            brand.demo
              ? 'Заявка сохранена в локальной админке. Это пробная версия: сообщения художнику пока не отправляются.'
              : 'Заявка сохранена. Она не резервирует работу и не подтверждает цену. Детали согласуем лично.',
            brand.demo
              ? 'Your request is saved in the local admin. This is a preview: no message has been sent to an artist.'
              : 'Your request is saved. This does not reserve a work or confirm a price. We’ll agree on the details personally.',
          )}
        </p>
        <ContactLinks brand={brand} />
        <Link className="button primary" href={`/${locale}`}>
          {text(locale, 'Вернуться к работам', 'Back to the collection')} <ArrowUpRight size={17} />
        </Link>
      </div>
    )
  if (kind === 'commission' && !commissionsOpen)
    return (
      <div className="empty-state">
        <h2>{text(locale, 'Заказы временно закрыты', 'Commissions are closed')}</h2>
        <p>
          {text(
            locale,
            'Новые заказы пока не принимаются. Можно посмотреть готовые работы или задать вопрос.',
            'Commissions are currently closed. Explore available works or ask a question.',
          )}
        </p>
        <Link className="text-link" href={`/${locale}/contact`}>
          {text(locale, 'Задать вопрос', 'Ask a question')} <ArrowUpRight size={16} />
        </Link>
      </div>
    )
  return (
    <form className="request-form" onSubmit={submit}>
      {kind === 'commission' && (
        <div className="form-stepper">
          <span className={step === 1 ? 'active' : 'done'}>
            <i>{step > 1 ? <Check size={12} /> : '1'}</i>
            {text(locale, 'Параметры', 'Details')}
          </span>
          <span className="stepper-line" />
          <span className={step === 2 ? 'active' : ''}>
            <i>2</i>
            {text(locale, 'Контакт', 'Contact')}
          </span>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {kind === 'commission' && (
        <div hidden={step !== 1}>
          <h2 className="form-title">{text(locale, 'Параметры картины', 'Painting details')}</h2>

          <fieldset className="subject-options">
            <legend>{text(locale, 'Сюжет', 'Subject')}</legend>
            {[
              ['portrait', text(locale, 'Портрет', 'Portrait')],
              ['landscape', text(locale, 'Пейзаж', 'Landscape')],
              ['still-life', text(locale, 'Натюрморт', 'Still life')],
              ['other', text(locale, 'Другая идея', 'Another idea')],
            ].map(([v, l]) => (
              <label key={v} className={subject === v ? 'selected' : ''}>
                <input
                  type="radio"
                  name="subject"
                  value={v}
                  checked={subject === v}
                  onChange={() => setSubject(v)}
                />
                {l}
              </label>
            ))}
          </fieldset>
          <div className="form-row">
            <label>
              {text(locale, 'Техника', 'Medium')}
              <select value={medium} onChange={(e) => setMedium(e.target.value)}>
                <option value="oil">{text(locale, 'Масло, холст', 'Oil on canvas')}</option>
                <option value="acrylic">{text(locale, 'Акрил, холст', 'Acrylic on canvas')}</option>
                <option value="unsure">{text(locale, 'Помогите выбрать', 'Help me choose')}</option>
              </select>
            </label>
            <label>
              {text(locale, 'Размер', 'Size')}
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                {['30x40', '40x40', '50x70'].map((v) => (
                  <option key={v} value={v}>
                    {v.replace('x', ' × ')} {text(locale, 'см', 'cm')}
                  </option>
                ))}
                <option value="custom">{text(locale, 'Свой размер', 'Custom size')}</option>
                <option value="unsure">{text(locale, 'Пока не знаю', 'Not sure yet')}</option>
              </select>
            </label>
          </div>
          {size === 'custom' && (
            <div className="form-row">
              <label>
                {text(locale, 'Ширина, см', 'Width, cm')}
                <input name="customWidth" type="number" min="5" max="300" required={step === 1} />
              </label>
              <label>
                {text(locale, 'Высота, см', 'Height, cm')}
                <input name="customHeight" type="number" min="5" max="300" required={step === 1} />
              </label>
            </div>
          )}
          <div className="estimate-panel" aria-live="polite">
            <span className="eyebrow">{text(locale, 'ПРИМЕРНО', 'ESTIMATE')}</span>
            {loadingQuote ? (
              <p className="estimate-loading">
                <LoaderCircle className="spin" size={18} />
                {text(locale, 'Считаю…', 'Estimating…')}
              </p>
            ) : quoteError ? (
              <p>
                {text(locale, 'Не удалось загрузить оценку.', 'Could not load the estimate.')}{' '}
                <button
                  type="button"
                  className="inline-button"
                  onClick={() => setRevision((r) => r + 1)}
                >
                  {text(locale, 'Повторить', 'Try again')}
                </button>
              </p>
            ) : quote ? (
              <>
                <div className="estimate-price">
                  {money(quote.minPrice, quote.currency, locale)} –{' '}
                  {money(quote.maxPrice, quote.currency, locale)}
                </div>
                <p>
                  {text(locale, 'Готовность', 'Ready in')}: {quote.minDays}–{quote.maxDays}{' '}
                  {text(locale, 'дней, включая просушку', 'days, including drying')}
                </p>
                <small>
                  {text(
                    locale,
                    'Цену и срок уточню, когда обсудим сюжет. Доставка отдельно.',
                    'I’ll confirm the price and timing after we discuss your idea. Shipping is extra.',
                  )}
                </small>
                {quote.demo && (
                  <small className="demo-note">
                    {text(
                      locale,
                      'Пример расценок для демонстрации интерфейса.',
                      'Example rates for this interface preview.',
                    )}
                  </small>
                )}
              </>
            ) : (
              <>
                <div className="estimate-manual">
                  {text(locale, 'Уточним вместе', 'Let’s work it out together')}
                </div>
                <p>
                  {text(
                    locale,
                    'Для этой идеи я рассчитаю цену и срок лично.',
                    'I’ll estimate this idea personally.',
                  )}
                </p>
              </>
            )}
          </div>
          <button
            className="button primary full"
            type="submit"
            disabled={loadingQuote || quoteError}
          >
            {text(locale, 'Далее', 'Continue')} <ArrowRight size={17} />
          </button>
        </div>
      )}
      <div hidden={step !== 2}>
        {kind === 'commission' && (
          <button type="button" className="back-button" onClick={() => setStep(1)}>
            ← {text(locale, 'Изменить параметры', 'Edit details')}
          </button>
        )}
        <h2 className="form-title">
          {text(
            locale,
            kind === 'question' ? 'Сообщение' : 'Контакт для ответа',
            kind === 'question' ? 'Message' : 'Reply contact',
          )}
        </h2>
        <div className="form-row contact-row">
          <label>
            {text(locale, 'Удобнее общаться', 'Preferred channel')}
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>
          <label htmlFor={`${id}-contact`}>
            {channel === 'email' ? 'Email' : text(locale, 'Имя пользователя', 'Username')}
            <input
              id={`${id}-contact`}
              name="contact"
              type={channel === 'email' ? 'email' : 'text'}
              placeholder={channel === 'email' ? 'you@example.com' : '@username'}
              required={step === 2}
              maxLength={150}
              autoComplete={channel === 'email' ? 'email' : 'off'}
            />
          </label>
        </div>
        <label>
          {text(
            locale,
            kind === 'question' ? 'Ваш вопрос' : 'Что хочется нарисовать?',
            kind === 'question' ? 'Your question' : 'What do you have in mind?',
          )}
          <textarea
            name="message"
            rows={4}
            required={kind === 'question' && step === 2}
            maxLength={3000}
            placeholder={text(
              locale,
              'Пожелания, настроение, важные детали…',
              'Wishes, mood, details that matter…',
            )}
          />
        </label>
        {kind === 'commission' && (
          <>
            <label>
              {text(locale, 'Ссылка на референс', 'Reference link')}{' '}
              <span className="optional">{text(locale, '(необязательно)', '(optional)')}</span>
              <input name="referenceLink" type="url" placeholder="https://…" maxLength={1000} />
            </label>
            <label className="upload-area">
              <ImagePlus size={22} strokeWidth={1.3} />
              <span>
                {files.length
                  ? files.map((f) => f.name).join(', ')
                  : text(locale, 'Добавить изображения', 'Add reference images')}
              </span>
              <small>
                {text(
                  locale,
                  'До 3 файлов JPG, PNG, WebP · до 5 МБ каждый',
                  'Up to 3 JPG, PNG, WebP files · 5 MB each',
                )}
              </small>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const selected = Array.from(event.target.files || [])
                  if (
                    selected.length > 3 ||
                    selected.some(
                      (f) =>
                        f.size > 5 * 1024 * 1024 ||
                        !['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
                    )
                  ) {
                    setFileError(errors.files)
                    setFiles([])
                    event.target.value = ''
                    return
                  }
                  setFileError('')
                  setFiles(selected)
                }}
              />
            </label>
            {fileError && (
              <p className="form-error" role="alert">
                {fileError}
              </p>
            )}
            <p className="private-note">
              <ShieldCheck size={14} />
              {text(
                locale,
                'Эти фотографии не появятся на сайте.',
                'These photos won’t appear on the site.',
              )}
            </p>
          </>
        )}
        <label className="checkbox-label">
          <input name="consent" type="checkbox" required={step === 2} />
          <span>
            {text(
              locale,
              'Согласен на обработку указанных данных для ответа на заявку.',
              'I agree to the use of these details to respond to my request.',
            )}{' '}
            <Link href={`/${locale}/privacy`}>{text(locale, 'Подробнее', 'Learn more')}</Link>
          </span>
        </label>
        <button
          className="button primary full"
          type="submit"
          disabled={sending || Boolean(fileError) || !key}
        >
          {sending ? <LoaderCircle className="spin" size={18} /> : <Mail size={17} />}{' '}
          {text(
            locale,
            sending ? 'Сохраняем…' : 'Отправить идею',
            sending ? 'Saving…' : 'Send your idea',
          )}
        </button>
        <p className="form-disclaimer">
          {text(
            locale,
            brand.demo
              ? 'Локальный пример: заявка сохранится в админке, художнику ничего не отправляется.'
              : 'Это начало разговора. Отправка не резервирует картину и не подтверждает итоговую цену.',
            brand.demo
              ? 'Local preview: your request is saved in admin. No message is sent to an artist.'
              : 'This starts a conversation. Submitting does not reserve a work or confirm a final price.',
          )}
        </p>
      </div>
    </form>
  )
}
