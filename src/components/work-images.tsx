'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'

export function WorkImages({
  images,
  title,
  locale,
}: {
  images: { id: number; url: string }[]
  title: string
  locale: Locale
}) {
  const [selected, setSelected] = useState(images[0]?.id)
  const current = images.find((image) => image.id === selected) ?? images[0]
  if (!current) return null
  return (
    <div>
      <a
        className="detail-image"
        href={current.url}
        target="_blank"
        rel="noreferrer"
        aria-label={text(locale, 'Открыть изображение крупнее', 'Open full-size image')}
      >
        <Image src={current.url} alt={title} fill priority sizes="(max-width: 800px) 90vw, 55vw" />
        <span className="zoom-label">
          <Expand size={16} />
          {text(locale, 'Рассмотреть ближе', 'A closer look')}
        </span>
      </a>
      {images.length > 1 && (
        <div
          className="work-thumbnails"
          aria-label={text(locale, 'Изображения галереи', 'Gallery images')}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-pressed={image.id === current.id}
              aria-label={text(locale, `Изображение ${index + 1}`, `Image ${index + 1}`)}
              onClick={() => setSelected(image.id)}
            >
              <Image src={image.url} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
