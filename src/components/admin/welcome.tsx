import Link from 'next/link'
export function StudioWelcome() {
  return (
    <section
      style={{
        marginBottom: 32,
        padding: '24px 28px',
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
      }}
    >
      <h2 style={{ margin: '0 0 12px' }}>Ваша мастерская</h2>
      <p style={{ margin: '0 0 16px', maxWidth: 780, lineHeight: 1.7 }}>
        Добавляйте картины, обновляйте цены и читайте обращения. Для новой работы достаточно
        названия, фотографии, описания и характеристик — ссылку на страницу создадим сами.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px' }}>
        <Link href="/admin/collections/artworks/create">Добавить картину →</Link>
        <Link href="/admin/collections/requests">Посмотреть заявки →</Link>
        <Link href="/admin/globals/studio">Имя и контакты →</Link>
        <Link href="/ru" target="_blank">
          Открыть сайт ↗
        </Link>
      </div>
      <p
        style={{
          margin: '18px 0 0',
          fontSize: 12,
          color: 'var(--theme-elevation-600)',
          lineHeight: 1.7,
        }}
      >
        Переключатель «Русский / English» внутри записи выбирает язык названия и описания. Кнопки
        админки остаются на русском. Сначала сохраните русский вариант, затем переключитесь на
        English и добавьте перевод.
      </p>
    </section>
  )
}
