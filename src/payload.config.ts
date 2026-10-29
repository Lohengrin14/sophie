import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildConfig,
  type CollectionConfig,
  type GlobalConfig,
  type Access,
  type NumberField,
} from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { ru } from '@payloadcms/translations/languages/ru'
import { artworkSlug, validStoredPrice } from './lib/admin-helpers'
import sharp from 'sharp'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const staff: Access = ({ req }) => Boolean(req.user)
const published: Access = ({ req }) => (req.user ? true : { published: { equals: true } })
const moneyField = (name: string, label: string, description: string): NumberField => ({
  name,
  type: 'number',
  label,
  required: true,
  min: 0,
  validate: validStoredPrice,
  admin: {
    placeholder: 'Например: 650',
    description,
    components: {
      Field: '/components/admin/money-field#MoneyField',
      Cell: '/components/admin/money-field#MoneyCell',
    },
  },
})
const mediumOptions = [
  { label: 'Масло, холст', value: 'oil' },
  { label: 'Акрил, холст', value: 'acrylic' },
]

const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Сотрудник', plural: 'Сотрудники' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Настройки',
    description: 'Учётные записи для входа в мастерскую. Это сотрудники, а не покупатели сайта.',
  },
  access: { create: staff, read: staff, update: staff, delete: staff },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя сотрудника',
      admin: {
        placeholder: 'Например: Анна',
        description:
          'Имя для внутренней работы. Имя художника на сайте задаётся в разделе «Художник и настройки».',
      },
    },
  ],
}
const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Изображения работ' },
  admin: {
    useAsTitle: 'alt',
    group: 'Студия',
    description:
      'Фотографии для каталога. Новое фото можно загрузить прямо при добавлении картины. JPG, PNG или WebP, до 5 МБ.',
  },
  access: { read: () => true, create: staff, update: staff, delete: staff },
  upload: {
    staticDir: path.resolve(dirname, '../media/artworks'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [{ name: 'card', width: 900, height: undefined, withoutEnlargement: true }],
    adminThumbnail: 'card',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      label: 'Что изображено на фото',
      admin: {
        placeholder: 'Например: Портрет девушки у окна, масло на холсте',
        description:
          'Одно короткое предложение для тех, кто не видит изображение. Это не имя файла. Перевод заполните в English.',
      },
    },
  ],
}
const References: CollectionConfig = {
  slug: 'references',
  labels: { singular: 'Референс', plural: 'Приватные референсы' },
  admin: {
    group: 'Обращения',
    description:
      'Изображения, приложенные посетителями к заявкам. Они не видны в публичном каталоге.',
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  upload: {
    staticDir: path.resolve(dirname, '../media/references'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  fields: [
    {
      name: 'note',
      type: 'text',
      label: 'Связанная заявка или заметка',
      admin: {
        description:
          'Например: ART-EC804CF3 — фото для портрета. Саму заявку ищите в разделе «Заявки».',
      },
    },
  ],
}
const Artworks: CollectionConfig = {
  slug: 'artworks',
  labels: { singular: 'Картина', plural: 'Картины' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'availability', 'priceMinor', 'published'],
    group: 'Студия',
    description:
      'Заполните русский вариант и сохраните. Затем выберите English и добавьте перевод названия и описания. Работа появится на сайте после включения «Показывать на сайте» и сохранения.',
  },
  access: { read: published, create: staff, update: staff, delete: staff },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        if (typeof data.slug === 'string' && data.slug.trim()) return data
        if (originalDoc?.slug) {
          data.slug = originalDoc.slug
          return data
        }
        const title =
          typeof data.title === 'string' ? data.title : data.title?.ru || data.title?.en || ''
        const base = artworkSlug(title)
        let candidate = base,
          suffix = 2
        while (
          (
            await req.payload.find({
              collection: 'artworks',
              overrideAccess: true,
              req,
              depth: 0,
              limit: 1,
              where: { slug: { equals: candidate } },
            })
          ).docs.length
        )
          candidate = `${base}-${suffix++}`
        data.slug = candidate
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Название картины',
      localized: true,
      required: true,
      admin: {
        placeholder: 'Например: Вечер у моря',
        description:
          'Так посетитель увидит работу в каталоге. Для English укажите английское название.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Фотография картины',
      required: true,
      admin: {
        description:
          'Выберите фото из медиатеки или нажмите «Создать» в этом поле, чтобы загрузить новое. JPG, PNG или WebP, до 5 МБ. Лучше без обрезки краёв картины.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание картины',
      localized: true,
      required: true,
      admin: {
        rows: 4,
        placeholder: 'Например: Тёплый вечерний свет и тихое море. Работа написана с натуры…',
        description:
          'Расскажите о сюжете, настроении и важных деталях. Не нужно повторять цену и размеры — для них есть отдельные поля.',
      },
    },
    {
      name: 'medium',
      type: 'select',
      label: 'Техника',
      defaultValue: 'oil',
      options: mediumOptions,
      admin: { description: 'Материал самой работы. Например: «Масло, холст».' },
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'width',
          type: 'number',
          label: 'Ширина, см',
          required: true,
          min: 1,
          admin: { placeholder: '40', description: 'Слева направо, без рамы. Например: 40.' },
        },
        {
          name: 'height',
          type: 'number',
          label: 'Высота, см',
          required: true,
          min: 1,
          admin: { placeholder: '60', description: 'Снизу вверх, без рамы. Например: 60.' },
        },
        {
          name: 'year',
          type: 'number',
          label: 'Год создания',
          required: true,
          defaultValue: 2026,
          admin: { placeholder: '2026', description: 'Когда закончена картина. Например: 2026.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        moneyField(
          'priceMinor',
          'Цена картины',
          'Введите обычную цену в выбранной валюте. Например: 650 или 650,50. Доставку сюда не включайте.',
        ),
        {
          name: 'currency',
          type: 'text',
          label: 'Валюта цены',
          required: true,
          defaultValue: 'EUR',
          admin: {
            placeholder: 'EUR',
            description:
              'EUR — евро, USD — доллары, RUB — рубли. Валюта не зависит от языка сайта.',
          },
          validate: (v: unknown) =>
            (typeof v === 'string' && /^[A-Z]{3}$/.test(v)) || 'Например EUR, USD или RUB',
        },
      ],
    },
    {
      name: 'availability',
      type: 'select',
      label: 'Наличие',
      defaultValue: 'available',
      required: true,
      options: [
        { label: 'Доступна', value: 'available' },
        { label: 'В резерве', value: 'reserved' },
        { label: 'Продана', value: 'sold' },
      ],
      admin: {
        description:
          '«Доступна» — можно оставить заявку. «В резерве» — уже обсуждаете покупку. «Продана» — остаётся в портфолио без покупки.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Выделить на главной',
      defaultValue: false,
      admin: {
        description:
          'Отмеченная работа может стать главной картиной первого экрана. Выберите одну основную работу.',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Показывать на сайте',
      defaultValue: false,
      admin: {
        description:
          'Выключено — черновик виден только здесь. Включите и сохраните, когда работа готова. Для каждого языка нужны название и описание.',
      },
    },
    {
      type: 'collapsible',
      label: 'Дополнительно: ссылка и порядок',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'slug',
          type: 'text',
          label: 'Ссылка на страницу картины',
          required: true,
          unique: true,
          admin: {
            readOnly: true,
            description:
              'Создаётся из названия при первом сохранении. «Вечер у моря» → vecher-u-morya. Страница будет /ru/works/vecher-u-morya и /en/works/vecher-u-morya. При переименовании ссылка сохраняется.',
          },
          validate: (v: unknown) =>
            !v ||
            (typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
            'Ссылка должна содержать латинские буквы, цифры и дефисы.',
        },
        {
          name: 'sortOrder',
          type: 'number',
          label: 'Порядок в каталоге',
          defaultValue: 0,
          admin: {
            placeholder: '0',
            description: 'Меньшее число — выше в списке. Например: 0, 10, 20. Можно оставить 0.',
          },
        },
        {
          name: 'demo',
          type: 'checkbox',
          label: 'Это демонстрационный пример',
          defaultValue: false,
          admin: {
            description:
              'Для тестовой картинки и вымышленных расценок. У настоящих работ выключайте: на сайте исчезнет подпись «Демонстрационная работа и цена».',
          },
        },
      ],
    },
  ],
}
const QuoteRules: CollectionConfig = {
  slug: 'quote-rules',
  labels: { singular: 'Ориентир', plural: 'Ориентиры заказов' },
  admin: {
    useAsTitle: 'label',
    group: 'Обращения',
    description:
      'Одно правило — одно сочетание сюжета, техники и размера. Например: портрет, масло, 40 × 40 см → 500–650 евро, 28–49 дней. Это предварительная оценка для формы, а не окончательная договорённость.',
  },
  access: { read: staff, create: staff, update: staff, delete: staff },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Название правила',
      required: true,
      admin: {
        placeholder: 'Например: Портрет маслом, 40 × 40',
        description: 'Видно только вам. Помогает быстро найти нужные расценки.',
      },
    },
    {
      name: 'subject',
      type: 'select',
      label: 'Сюжет',
      options: [
        { label: 'Портрет', value: 'portrait' },
        { label: 'Пейзаж', value: 'landscape' },
        { label: 'Натюрморт', value: 'still-life' },
      ],
      required: true,
    },
    {
      name: 'medium',
      type: 'select',
      label: 'Техника',
      options: mediumOptions,
      required: true,
    },
    {
      name: 'size',
      type: 'select',
      label: 'Размер',
      options: [
        { label: '30 × 40 см', value: '30x40' },
        { label: '40 × 40 см', value: '40x40' },
        { label: '50 × 70 см', value: '50x70' },
      ],
      admin: {
        description: 'Стандартный размер из формы заказа. Произвольные размеры обсуждаются лично.',
      },
      required: true,
    },
    moneyField(
      'minPrice',
      'Примерная цена от',
      'Обычная сумма, например: 500. Не умножайте на 100.',
    ),
    moneyField(
      'maxPrice',
      'Примерная цена до',
      'Верхняя граница, например: 650. Не меньше суммы «от».',
    ),
    {
      name: 'currency',
      type: 'text',
      label: 'Валюта оценки',
      defaultValue: 'EUR',
      required: true,
      admin: {
        placeholder: 'EUR',
        description: 'Например: EUR — евро, USD — доллары, RUB — рубли.',
      },
      validate: (v: unknown) =>
        (typeof v === 'string' && /^[A-Z]{3}$/.test(v)) ||
        'Укажите три заглавные буквы: EUR, USD или RUB.',
    },
    {
      name: 'minDays',
      type: 'number',
      label: 'Готовность от, дней (включая просушку)',
      required: true,
      min: 1,
      admin: {
        placeholder: '28',
        description:
          'Самый ранний срок до готовности: очередь + живопись + нужная просушка. Например: 28 дней. Без доставки.',
      },
    },
    {
      name: 'maxDays',
      type: 'number',
      label: 'Готовность до, дней',
      required: true,
      min: 1,
      admin: {
        placeholder: '49',
        description: 'Верхняя граница, например: 49 дней. Не меньше срока «от».',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Использовать это правило',
      defaultValue: true,
      admin: {
        description:
          'Выключите, чтобы временно убрать оценку из формы, сохранив правило. Не создавайте два активных правила для одинакового сочетания.',
      },
    },
    {
      name: 'demo',
      type: 'checkbox',
      label: 'Это пример, а не реальные расценки',
      defaultValue: false,
      admin: {
        description:
          'На сайте появится пометка о демонстрационной оценке. Выключайте после ввода настоящих цен и сроков.',
      },
    },
  ],
}
const Requests: CollectionConfig = {
  slug: 'requests',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'reference',
    group: 'Обращения',
    defaultColumns: ['reference', 'kind', 'status', 'createdAt'],
    description:
      'Обращения с сайта. Откройте заявку, посмотрите пожелания и контакт, свяжитесь с человеком и обновите статус. Внутренние заметки посетителю не видны.',
  },
  access: { read: staff, create: () => false, update: staff, delete: staff },
  fields: [
    {
      name: 'reference',
      type: 'text',
      label: 'Номер заявки',
      unique: true,
      required: true,
      admin: {
        readOnly: true,
        description: 'Присваивается автоматически. По нему можно найти обращение.',
      },
    },
    { name: 'idempotencyKey', type: 'text', unique: true, required: true, admin: { hidden: true } },
    {
      name: 'kind',
      type: 'select',
      label: 'Что интересует человека',
      options: [
        { label: 'Покупка готовой картины', value: 'purchase' },
        { label: 'Картина на заказ', value: 'commission' },
        { label: 'Общий вопрос', value: 'question' },
      ],
      required: true,
    },
    {
      name: 'locale',
      type: 'select',
      label: 'Язык посетителя',
      options: [
        { label: 'Русский', value: 'ru' },
        { label: 'Английский', value: 'en' },
      ],
      required: true,
      admin: { description: 'На каком языке человек заполнил форму. Поможет выбрать язык ответа.' },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Имя посетителя',
      admin: { description: 'Может быть пустым: в форме имя необязательно.' },
    },
    {
      name: 'channel',
      type: 'select',
      label: 'Способ связи',
      options: [
        { label: 'Электронная почта', value: 'email' },
        { label: 'Telegram', value: 'telegram' },
        { label: 'Instagram', value: 'instagram' },
      ],
      required: true,
    },
    {
      name: 'contact',
      type: 'text',
      label: 'Куда ответить',
      required: true,
      admin: {
        description:
          'Email или имя пользователя в выбранном мессенджере. Например: anna@example.com или @anna_art.',
      },
    },
    { name: 'message', type: 'textarea', label: 'Сообщение посетителя' },
    {
      name: 'artwork',
      type: 'relationship',
      relationTo: 'artworks',
      label: 'Выбранная картина',
      admin: {
        description:
          'Заполняется при заявке на готовую работу. Для индивидуального заказа может быть пустым.',
      },
    },
    {
      name: 'details',
      type: 'json',
      label: 'Детали и предварительная оценка',
      admin: {
        readOnly: true,
        components: { Field: '/components/admin/request-details#RequestDetails' },
      },
    },
    {
      name: 'references',
      type: 'relationship',
      relationTo: 'references',
      hasMany: true,
      label: 'Приложенные изображения',
      admin: {
        description:
          'Фотографии и примеры от посетителя. Открываются только сотрудникам, на сайт не публикуются.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'Обсуждаем', value: 'discussing' },
        { label: 'Согласовано', value: 'accepted' },
        { label: 'Завершена', value: 'completed' },
        { label: 'Отменена', value: 'cancelled' },
      ],
      admin: {
        description:
          'Новая → Обсуждаем → Согласовано → Завершена. Статус заявки не меняет наличие картины автоматически.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки для себя',
      admin: {
        placeholder: 'Например: Написала 29 октября, уточняем доставку в Берлин.',
        description:
          'Видны только сотрудникам. Можно записать договорённости, цену, сроки и следующий шаг.',
      },
    },
    { name: 'consentVersion', type: 'text', admin: { hidden: true } },
  ],
}
const Studio: GlobalConfig = {
  slug: 'studio',
  label: 'Художник и настройки',
  admin: {
    group: 'Настройки',
    description:
      'Имя, контакты и информация на сайте. Можно заполнить всё здесь; если значение уже задано в конфигурации разработчиком, оно имеет приоритет. Перевод биографии добавляется через переключатель языка.',
  },
  access: { read: () => true, update: staff },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя художника',
      admin: {
        placeholder: 'Например: Анна Иванова',
        description: 'Имя на странице художника и внизу сайта. Это пример — укажите своё.',
      },
    },
    {
      name: 'alias',
      type: 'text',
      label: 'Псевдоним или название студии',
      admin: {
        placeholder: 'Например: ANNA ART',
        description:
          'Короткая подпись в шапке сайта. Если оставить пустым, используем имя художника.',
      },
    },
    {
      name: 'instagram',
      type: 'text',
      label: 'Ссылка на Instagram',
      admin: {
        placeholder: 'https://www.instagram.com/your_name/',
        description:
          'Полная ссылка на профиль, не просто @имя. Если оставить пустым, ссылка не показывается.',
      },
    },
    {
      name: 'telegram',
      type: 'text',
      label: 'Ссылка на Telegram',
      admin: {
        placeholder: 'https://t.me/your_name',
        description:
          'Полная ссылка на ваш публичный профиль. Это не токен бота. Можно оставить пустым.',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Почта для посетителей',
      admin: {
        placeholder: 'hello@example.com',
        description: 'Публичный адрес для связи. Он появится на сайте, если заполнен.',
      },
    },
    {
      name: 'about',
      type: 'textarea',
      localized: true,
      label: 'Рассказ о художнике',
      admin: {
        rows: 6,
        placeholder: 'Например: Пишу маслом пейзажи и портреты. Меня вдохновляют…',
        description:
          'Расскажите о себе, материалах и вдохновении. Для English заполните английский вариант.',
      },
    },
    {
      name: 'commissionsOpen',
      type: 'checkbox',
      label: 'Принимать индивидуальные заказы',
      defaultValue: true,
      admin: {
        description:
          'Выключите, если заняты: форма заказа покажет паузу. Каталог готовых работ продолжит работать.',
      },
    },
  ],
}

if (!process.env.PAYLOAD_SECRET)
  throw new Error('PAYLOAD_SECRET is missing. Run npm run setup first (see README).')

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Artist Studio' },
    components: { beforeDashboard: ['/components/admin/welcome#StudioWelcome'] },
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [Users, Media, Artworks, QuoteRules, Requests, References],
  globals: [Studio],
  localization: {
    locales: [
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'ru',
    fallback: false,
  },
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  upload: { limits: { fileSize: 5 * 1024 * 1024 } },
})
