export function ArtworkGuide() {
  return (
    <aside
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
        padding: '18px 22px',
        marginBottom: 28,
      }}
    >
      <strong>Добавляем картину — три простых шага</strong>
      <ol style={{ paddingLeft: 20, margin: '12px 0', lineHeight: 1.85 }}>
        <li>Загрузите фото, напишите название и несколько слов о работе.</li>
        <li>Укажите размер, обычную цену и выберите валюту из списка.</li>
        <li>Включите «Показывать на сайте» и нажмите «Сохранить».</li>
      </ol>
      <p style={{ margin: 0, color: 'var(--theme-elevation-600)', fontSize: 12, lineHeight: 1.7 }}>
        Ссылку придумывать не нужно. Для английской версии переключите язык записи на English,
        переведите название и описание и сохраните ещё раз. Если пока не готовы — оставьте
        «Показывать на сайте» выключенным.
      </p>
    </aside>
  )
}
