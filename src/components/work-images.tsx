'use client'
import { useEffect, useRef, useState, type TouchEvent, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Expand, X, Maximize2, Minimize2 } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import { GalleryFrames } from './gallery-frames'
import { galleryIndex } from '@/lib/gallery-view'

export function WorkImages({
  images,
  title,
  locale,
}: {
  images: { id: number; url: string }[]
  title: string
  locale: Locale
}) {
  const [selected, setSelected] = useState(0)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )
  function closeViewer() {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(
      () => {
        setOpen(false)
        setClosing(false)
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180,
    )
  }
  const urls = images.map((image) => image.url)
  const dialog = useRef<HTMLDialogElement>(null)
  const thumbnailStrip = useRef<HTMLDivElement>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const suppressClickUntil = useRef(0)
  const current = images[selected] || images[0]
  const move = (direction: number) =>
    setSelected((index) => galleryIndex(index, direction, images.length))
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open) {
      node.showModal()
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        node.close()
        document.body.style.overflow = previous
      }
    }
    node.close()
  }, [open])
  useEffect(() => {
    const strip = thumbnailStrip.current
    const active = strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    if (strip && active) {
      const left = active.offsetLeft - strip.offsetLeft
      if (left < strip.scrollLeft) strip.scrollTo({ left, behavior: 'instant' })
      else if (left + active.offsetWidth > strip.scrollLeft + strip.clientWidth)
        strip.scrollTo({ left: left + active.offsetWidth - strip.clientWidth, behavior: 'instant' })
    }
  }, [selected])

  function touchStart(event: TouchEvent) {
    if (event.touches.length === 1)
      origin.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  function touchEnd(event: TouchEvent) {
    if (!origin.current) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - origin.current.x,
      dy = touch.clientY - origin.current.y
    origin.current = null
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      move(dx < 0 ? 1 : -1)
      suppressClickUntil.current = Date.now() + 450
    }
  }
  function keys(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(event.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  const previousLabel = text(locale, 'Предыдущее изображение', 'Previous image'),
    nextLabel = text(locale, 'Следующее изображение', 'Next image')
  function arrows() {
    return (
      images.length > 1 && (
        <>
          <button
            type="button"
            className="viewer-arrow previous"
            onClick={() => move(-1)}
            disabled={selected === 0}
            aria-label={previousLabel}
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            className="viewer-arrow next"
            onClick={() => move(1)}
            disabled={selected === images.length - 1}
            aria-label={nextLabel}
          >
            <ArrowRight size={22} />
          </button>
        </>
      )
    )
  }
  if (!current) return null
  return (
    <div className="work-viewer" onKeyDown={keys}>
      <div
        className="work-stage"
        onTouchStart={touchStart}
        onTouchEnd={touchEnd}
        onTouchCancel={() => {
          origin.current = null
        }}
      >
        <button
          type="button"
          className="work-open-image"
          aria-label={text(locale, 'Открыть изображение крупнее', 'Open full-size image')}
          onClick={() => {
            if (Date.now() > suppressClickUntil.current) setOpen(true)
          }}
        >
          <GalleryFrames
            images={urls}
            index={selected}
            title={title}
            priority
            sizes="(max-width: 800px) 96vw, 70vw"
            warm
          />
          <span className="zoom-label">
            <Expand size={16} />
            {text(locale, 'Рассмотреть ближе', 'A closer look')}
          </span>
        </button>
        {arrows()}
      </div>
      {images.length > 1 && (
        <div
          className="work-thumbnails"
          ref={thumbnailStrip}
          aria-label={text(locale, 'Изображения галереи', 'Gallery images')}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-pressed={index === selected}
              aria-label={text(locale, `Изображение ${index + 1}`, `Image ${index + 1}`)}
              onClick={() => setSelected(index)}
            >
              <Image src={image.url} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <span className="viewer-position" role="status" aria-live="polite">
        {selected + 1} / {images.length}
      </span>
      <dialog
        ref={dialog}
        className={`work-lightbox ${expanded ? 'is-expanded' : ''} ${closing ? 'is-closing' : ''}`}
        aria-label={text(locale, `Картина «${title}»`, `Artwork “${title}”`)}
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          event.preventDefault()
          closeViewer()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer()
        }}
      >
        {open && (
          <>
            <div className="lightbox-toolbar">
              <span>
                {title} · {selected + 1} / {images.length}
              </span>
              <div className="lightbox-actions">
                <button
                  type="button"
                  className="lightbox-close"
                  aria-label={text(
                    locale,
                    expanded ? 'Вернуть поля' : 'Увеличить изображение',
                    expanded ? 'Restore margins' : 'Expand image',
                  )}
                  aria-pressed={expanded}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? <Minimize2 size={21} /> : <Maximize2 size={21} />}
                </button>
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={closeViewer}
                  aria-label={text(locale, 'Закрыть просмотр', 'Close viewer')}
                >
                  <X size={25} />
                </button>
              </div>
            </div>
            <div
              className="lightbox-stage"
              onTouchStart={touchStart}
              onTouchEnd={touchEnd}
              onTouchCancel={() => {
                origin.current = null
              }}
            >
              <Image
                className="lightbox-poster"
                src={current.url}
                alt=""
                aria-hidden="true"
                fill
                loading="eager"
                sizes="(max-width: 800px) 96vw, 70vw"
              />
              <GalleryFrames images={urls} index={selected} title={title} sizes="100vw" warm />
              {arrows()}
            </div>
            {images.length > 1 && (
              <div className="work-thumbnails lightbox-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={text(locale, `Изображение ${index + 1}`, `Image ${index + 1}`)}
                    aria-pressed={selected === index}
                    onClick={() => setSelected(index)}
                  >
                    <Image src={image.url} alt="" fill sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </dialog>
    </div>
  )
}
