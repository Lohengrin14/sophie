import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildConfig,
  type CollectionConfig,
  type GlobalConfig,
  type Access,
  type NumberField,
  ValidationError,
  APIError,
} from 'payload'
import { localizeAdminMetadata } from './lib/admin-metadata'
import { galleryImageIDs, requestStatuses } from './lib/studio-admin'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { can, isAdmin, sections, sectionNames, type Section } from './lib/studio-access'
import { ru } from '@payloadcms/translations/languages/ru'
import { artworkSlug, validStoredPrice } from './lib/admin-helpers'
import sharp from 'sharp'
import { databaseOptions } from './lib/database'
import { storagePlugins } from './lib/storage'
import { MAX_IMAGE_BYTES } from './lib/upload-limits'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const sectionAccess =
  (section: Section, action: 'read' | 'edit' = 'read'): Access =>
  ({ req }) =>
    can(req.user, section, action)
const published: Access = ({ req }) =>
  can(req.user, 'gallery') ? true : { published: { equals: true } }
const moneyField = (
  name: string,
  label: string,
  description: string,
  required = true,
): NumberField => ({
  name,
  type: 'number',
  label,
  required,
  min: 0,
  validate: (value: unknown) => (!required && value == null) || validStoredPrice(value),
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
  auth: { cookies: { secure: process.env.GOOGLE_AUTH_ORIGIN?.startsWith('https:') ?? false } },
  admin: {
    useAsTitle: 'email',
    group: 'Настройки',
    description: 'Учётные записи для входа в мастерскую. Это сотрудники, а не покупатели сайта.',
  },
  access: {
    create: sectionAccess('users', 'edit'),
    read: sectionAccess('users'),
    update: ({ req }) =>
      isAdmin(req.user)
        ? true
        : can(req.user, 'users', 'edit')
          ? { role: { equals: 'staff' } }
          : false,
    delete: ({ req }) =>
      isAdmin(req.user)
        ? true
        : can(req.user, 'users', 'edit')
          ? { role: { equals: 'staff' } }
          : false,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (
          operation === 'create' &&
          !(await req.payload.count({ collection: 'users', overrideAccess: true, req })).totalDocs
        ) {
          data.role = 'admin'
          return data
        }
        if (operation === 'create' && !data.role) data.role = 'staff'
        if (!isAdmin(req.user)) {
          const changedPermissions =
            data.permissions !== undefined &&
            sections.some((section) =>
              (['read', 'edit'] as const).some(
                (action) =>
                  Boolean(data.permissions?.[section]?.[action]) !==
                  Boolean(originalDoc?.permissions?.[section]?.[action]),
              ),
            )
          if (
            (operation === 'update' && isAdmin(originalDoc)) ||
            data.role === 'admin' ||
            changedPermissions
          )
            throw new APIError(
              'Только администратор может назначать доступы или менять администратора.',
              403,
            )
          data.role = originalDoc?.role || 'staff'
        }
        if (
          originalDoc?.id === req.user?.id &&
          data.role &&
          data.role !== 'admin' &&
          isAdmin(originalDoc)
        )
          throw new APIError('Нельзя снять права администратора у себя.', 400)
        return data
      },
    ],
    beforeDelete: [
      ({ id, req }) => {
        if (String(id) === String(req.user?.id))
          throw new APIError('Нельзя удалить свой аккаунт.', 400)
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Сотрудник', value: 'staff' },
      ],
      label: 'Роль',
    },
    {
      name: 'permissions',
      type: 'group',
      label: 'Доступы к разделам',
      fields: sections.map((name) => ({
        name,
        type: 'group',
        label: sectionNames[name],
        fields: [
          { name: 'read', type: 'checkbox', label: 'Чтение', defaultValue: false },
          { name: 'edit', type: 'checkbox', label: 'Изменение', defaultValue: false },
        ],
      })),
    },
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
      'Фотографии для каталога. Новое фото можно загрузить прямо при добавлении картины. JPG, PNG или WebP, до 4 МБ.',
  },
  access: {
    read: () => true,
    create: ({ req }) => can(req.user, 'gallery', 'edit') || can(req.user, 'artist', 'edit'),
    // Media files can be shared across sections. Editors upload replacements and
    // change their own section's reference; only admins overwrite shared files.
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
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
  access: {
    read: sectionAccess('requests'),
    create: sectionAccess('requests', 'edit'),
    update: sectionAccess('requests', 'edit'),
    delete: sectionAccess('requests', 'edit'),
  },
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
  labels: { singular: 'Галерея', plural: 'Галереи' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'availability', 'priceRubMinor', 'priceUsdMinor', 'published'],
    group: 'Студия',
    description:
      'Галерея объединяет работу и её изображения. Для публикации в каждом языке нужно название; описание необязательно. Основной редактор находится на главной мастерской.',
  },
  access: {
    read: published,
    create: sectionAccess('gallery', 'edit'),
    update: sectionAccess('gallery', 'edit'),
    delete: sectionAccess('gallery', 'edit'),
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (!data) return data
        if (data.image !== undefined || data.images !== undefined) {
          try {
            data.images = galleryImageIDs(
              data.images ?? originalDoc?.images,
              data.image ?? originalDoc?.image,
            )
          } catch (error) {
            throw new ValidationError({
              errors: [{ path: 'images', message: (error as Error).message }],
            })
          }
        }
        return data
      },
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
      name: 'artworkGuide',
      type: 'ui',
      admin: { components: { Field: '/components/admin/artwork-guide#ArtworkGuide' } },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Название картины',
      localized: true,
      validate: (value: unknown, { operation }: { operation?: string }) =>
        (operation === 'update' && value == null) ||
        (typeof value === 'string' && value.trim().length > 0) ||
        'Укажите название галереи.',
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
          'Выберите фото из медиатеки или нажмите «Создать» в этом поле, чтобы загрузить новое. JPG, PNG или WebP, до 4 МБ. Лучше без обрезки краёв картины.',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      maxRows: 10,
      label: 'Изображения галереи',
      admin: {
        description:
          'До 10 изображений вместе с обложкой. Главное изображение выбирается отдельно.',
      },
    },
    {
      name: 'displaySize',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 4,
      label: 'Размер на доске',
      validate: (value: unknown) =>
        value == null ||
        (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10) ||
        'Выберите размер от 1 до 10.',
      admin: {
        description: '10 шагов от 1× до 4×. Сантиметры определяют только пропорции.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание картины',
      localized: true,
      admin: {
        rows: 4,
        placeholder: 'Например: Тёплый вечерний свет и тихое море. Работа написана с натуры…',
        description:
          'Необязательно. Расскажите о сюжете и материалах. Под изображениями на главной этот текст не выводится.',
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
          'priceRubMinor',
          'Цена в рублях ₽',
          'Для русской версии сайта. Не заполнено — цена не показывается.',
          false,
        ),
        moneyField(
          'priceUsdMinor',
          'Цена в долларах $',
          'Для английской версии сайта. Не заполнено — цена не показывается.',
          false,
        ),
      ],
    },
    {
      type: 'row',
      admin: { hidden: true },
      fields: [
        { name: 'priceMinor', type: 'number', label: 'Прежняя цена', min: 0 },
        {
          name: 'currency',
          type: 'text',
          label: 'Валюта цены',
          required: false,
          admin: {
            components: { Field: '/components/admin/currency-field#CurrencyField' },
            description:
              'Выберите валюту, в которой продаётся эта картина. На обоих языках сайта цена остаётся в этой валюте. Автоматического пересчёта пока нет.',
          },
          validate: (v: unknown) =>
            v == null ||
            (typeof v === 'string' && /^[A-Z]{3}$/.test(v)) ||
            'Например EUR, USD или RUB',
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
        { label: 'Продана', value: 'sold' },
      ],
      admin: {
        description:
          '«Доступна» — можно оставить заявку. «Продана» — остаётся в портфолио без покупки.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Старая отметка витрины',
      defaultValue: false,
      admin: {
        description:
          'Сохранено для совместимости API. Порядок теперь задаётся приоритетом галереи.',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Показывать на сайте',
      defaultValue: false,
      admin: {
        description:
          'Выключено — черновик виден только сотрудникам. Для каждого языка нужно название; описание необязательно.',
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
          label: 'Приоритет галереи',
          defaultValue: 25,
          min: 1,
          max: 50,
          validate: (value: unknown) =>
            value == null ||
            (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 50) ||
            'Выберите приоритет от 1 до 50.',
          admin: {
            placeholder: '25',
            description:
              '1 — первое место, 50 — последнее. При равенстве: размер на доске по убыванию, затем название.',
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
  labels: { singular: 'Расценка', plural: 'Цены и сроки' },
  admin: {
    useAsTitle: 'label',
    group: 'Обращения',
    description:
      'Одно правило — одно сочетание сюжета, техники и размера. Например: портрет, масло, 40 × 40 см → 500–650 евро, 28–49 дней. Это предварительная оценка для формы, а не окончательная договорённость.',
  },
  access: {
    read: sectionAccess('quotes'),
    create: sectionAccess('quotes', 'edit'),
    update: sectionAccess('quotes', 'edit'),
    delete: sectionAccess('quotes', 'edit'),
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (!data) return data
        const value = { ...originalDoc, ...data }
        const errors: { path: string; message: string }[] = []
        if (
          typeof value.minPrice === 'number' &&
          typeof value.maxPrice === 'number' &&
          value.maxPrice < value.minPrice
        )
          errors.push({ path: 'maxPrice', message: 'Цена «до» не может быть меньше цены «от».' })
        if (
          typeof value.minDays === 'number' &&
          typeof value.maxDays === 'number' &&
          value.maxDays < value.minDays
        )
          errors.push({ path: 'maxDays', message: 'Срок «до» не может быть меньше срока «от».' })
        if (errors.length) throw new ValidationError({ errors })
        return data
      },
    ],
  },
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
        components: { Field: '/components/admin/currency-field#CurrencyField' },
        description:
          'В этой валюте посетитель увидит обе границы оценки. Смена валюты не пересчитывает введённые суммы.',
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
  access: {
    read: sectionAccess('requests'),
    create: () => false,
    update: sectionAccess('requests', 'edit'),
    delete: sectionAccess('requests', 'edit'),
  },
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
      options: requestStatuses.map(([value, label]) => ({ value, label })),
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
    {
      name: 'referenceCount',
      type: 'number',
      defaultValue: 0,
      admin: { hidden: true },
      hooks: {
        beforeValidate: [
          ({ data, value }) =>
            Array.isArray(data?.references) ? data.references.length : value || 0,
        ],
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
      'Имя, контакты и информация на сайте. Заполненные значения отсюда имеют приоритет над резервными настройками разработчика. Перевод биографии добавляется через переключатель языка.',
  },
  access: { read: () => true, update: sectionAccess('artist', 'edit') },
  fields: [
    {
      name: 'purchaseChannel',
      type: 'select',
      defaultValue: 'auto',
      label: 'Куда ведёт кнопка «Купить»',
      options: [
        { value: 'auto', label: 'Автоматически' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'email', label: 'Электронная почта' },
      ],
      admin: {
        description:
          'Укажите контакт выбранного канала. Без него используем другой заполненный контакт.',
      },
    },
    { name: 'sellerName', type: 'text', label: 'Продавец: ФИО или наименование', maxLength: 200 },
    { name: 'sellerCountry', type: 'text', label: 'Страна продавца', maxLength: 100 },
    {
      name: 'sellerStatus',
      type: 'select',
      label: 'Статус продавца',
      options: [
        { value: 'individual', label: 'Физическое лицо' },
        { value: 'self-employed', label: 'Самозанятый' },
        { value: 'entrepreneur', label: 'ИП' },
        { value: 'company', label: 'Компания' },
        { value: 'other', label: 'Другой статус' },
      ],
    },
    { name: 'sellerTaxId', type: 'text', label: 'ИНН / налоговый номер', maxLength: 40 },
    {
      name: 'sellerRegistration',
      type: 'text',
      label: 'ОГРН / ОГРНИП / регистрационный номер',
      maxLength: 40,
    },
    { name: 'sellerAddress', type: 'text', label: 'Адрес продавца', maxLength: 500 },
    { name: 'sellerEmail', type: 'email', label: 'Email для обращений' },
    { name: 'sellerPhone', type: 'text', label: 'Телефон продавца', maxLength: 50 },
    {
      name: 'sellerTerms',
      type: 'textarea',
      localized: true,
      label: 'Условия покупки, доставки и обращений',
      maxLength: 6000,
    },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография художника' },
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
  plugins: storagePlugins(),
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Artist Studio' },
    components: {
      beforeLogin: ['/components/admin/google-login#GoogleLogin'],
      header: ['/components/admin/studio-header#StudioHeader'],
      Nav: '/components/admin/studio-header#StudioNav',
      views: { dashboard: { Component: '/components/admin/studio-dashboard#StudioDashboard' } },
    },
  },
  i18n: { supportedLanguages: { ru, en }, fallbackLanguage: 'ru' },
  collections: [Users, Media, Artworks, QuoteRules, Requests, References].map((collection) =>
    localizeAdminMetadata(collection),
  ),
  globals: [localizeAdminMetadata(Studio)],
  localization: {
    locales: [
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'ru',
    fallback: false,
  },
  db: postgresAdapter({
    ...databaseOptions(),
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  upload: { limits: { fileSize: MAX_IMAGE_BYTES } },
})
