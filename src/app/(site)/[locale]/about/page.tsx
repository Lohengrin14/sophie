import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ContactLinks } from '@/components/footer'
import { getStudio } from '@/lib/data'
import { isLocale, text } from '@/lib/i18n'
export const metadata = { title: 'Художник / Artist' }
export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const studio = await getStudio(locale)
  const photo = studio.photo && typeof studio.photo === 'object' ? studio.photo : null
  return (
    <main id="main" className="container page-main artist-page">
      <div className="artist-info">
        <h1>{studio.brand.name || studio.brand.alias || text(locale, 'Художник', 'Artist')}</h1>
        <div id="contacts">
          <ContactLinks brand={studio.brand} className="artist-contacts" />
        </div>
        {studio.brand.name && studio.brand.alias && studio.brand.name !== studio.brand.alias && (
          <p className="artist-alias">{studio.brand.alias}</p>
        )}
      </div>
      <div className={`about-layout ${photo?.url ? '' : 'without-photo'}`}>
        {photo?.url && (
          <div className="about-image">
            <Image
              src={photo.url}
              alt={studio.brand.name || text(locale, 'Художник', 'Artist')}
              fill
              priority
              sizes="(max-width:800px) 94vw, 45vw"
            />
          </div>
        )}
        {studio.about && <p className="about-text">{studio.about}</p>}
      </div>
    </main>
  )
}
