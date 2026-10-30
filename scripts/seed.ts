import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })
const users = await payload.count({ collection: 'users' })
if (users.totalDocs === 0) {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local')
  await payload.create({
    collection: 'users',
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: 'Владелец студии',
    },
  })
  console.log('Local admin created. Credentials are stored in .env.local, not printed.')
}

const examples = [
  {
    slug: 'olive-grove',
    ru: 'Там, где тише',
    en: 'Where the world slows',
    file: 'olive-grove.png',
    width: 60,
    height: 40,
    priceMinor: 65000,
    availability: 'available',
    descriptionRu:
      'Тёплый свет, серебристые листья и спокойствие южного полудня. Демонстрационная иллюстрация, созданная ИИ, — пример того, как будет выглядеть ваша работа в галерее.',
    descriptionEn:
      'Warm light, silvery leaves and the stillness of a southern afternoon. An AI-generated demonstration image showing how an artwork will appear in the gallery.',
  },
  {
    slug: 'morning-by-the-sea',
    ru: 'Море до пробуждения',
    en: 'Before the sea wakes',
    file: 'sea.png',
    width: 70,
    height: 40,
    priceMinor: 78000,
    availability: 'available',
    descriptionRu:
      'Утренний воздух и мягкая линия берега. Демонстрационная иллюстрация, созданная ИИ. Размер, техника и цена приведены для примера.',
    descriptionEn:
      'Morning air and the gentle line of the coast. An AI-generated demonstration image. Dimensions, medium and price are illustrative.',
  },
  {
    slug: 'a-simple-afternoon',
    ru: 'Простые радости',
    en: 'A simple afternoon',
    file: 'pears.png',
    width: 30,
    height: 45,
    priceMinor: 42000,
    availability: 'sold',
    descriptionRu:
      'Небольшой натюрморт о красоте привычных вещей. Демонстрационная иллюстрация, созданная ИИ. Пример проданной работы в портфолио.',
    descriptionEn:
      'A quiet still life about beauty in everyday things. An AI-generated demonstration image, shown as an example of a collected work.',
  },
] as const

for (const [index, example] of examples.entries()) {
  const exists = await payload.count({
    collection: 'artworks',
    where: { slug: { equals: example.slug } },
  })
  if (exists.totalDocs > 0) continue
  const image = await payload.create({
    collection: 'media',
    locale: 'ru',
    data: { alt: example.ru },
    filePath: `${process.cwd()}/public/art/${example.file}`,
  })
  await payload.update({
    collection: 'media',
    id: image.id,
    locale: 'en',
    data: { alt: example.en },
  })
  const work = await payload.create({
    collection: 'artworks',
    locale: 'ru',
    data: {
      title: example.ru,
      slug: example.slug,
      description: example.descriptionRu,
      image: image.id,
      width: example.width,
      height: example.height,
      priceMinor: example.priceMinor,
      availability: example.availability,
      medium: 'oil',
      currency: 'EUR',
      year: 2026,
      published: true,
      featured: true,
      demo: true,
      sortOrder: index + 1,
    },
  })
  await payload.update({
    collection: 'artworks',
    id: work.id,
    locale: 'en',
    data: { title: example.en, description: example.descriptionEn },
  })
}

for (const subject of ['portrait', 'landscape', 'still-life'] as const) {
  for (const [size, factor] of [
    ['30x40', 1],
    ['40x40', 1.25],
    ['50x70', 1.9],
  ] as const) {
    const label = `${subject} / oil / ${size}`
    if (
      (await payload.count({ collection: 'quote-rules', where: { label: { equals: label } } }))
        .totalDocs
    )
      continue
    const base = subject === 'portrait' ? 40000 : 32000
    await payload.create({
      collection: 'quote-rules',
      data: {
        label,
        subject,
        medium: 'oil',
        size,
        minPrice: Math.round(base * factor),
        maxPrice: Math.round(base * factor * 1.3),
        currency: 'EUR',
        minDays: 28,
        maxDays: 49,
        active: true,
        demo: true,
      },
    })
  }
}
console.log('Demo collection and example quote rules are ready. Existing content was preserved.')
await payload.destroy()
process.exit(0)
