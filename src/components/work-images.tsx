'use client'
import {
  useEffect,
  useRef,
  useState,
  type TouchEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { text, type Locale } from '@/lib/i18n'
import { GalleryFrames } from './gallery-frames'
import { ShareArtwork } from './share-artwork'
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
  const [hasOpened, setHasOpened] = useState(false)
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )
  function openViewer(index = selected) {
    if (Date.now() <= suppressClickUntil.current) return
    setSelected(index)
    setHasOpened(true)
    setExpanded(true)
    setOpen(true)
  }
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
  }, [selected, open, expanded])

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
  function imageClick(event: MouseEvent<HTMLButtonElement>) {
    if (Date.now() <= suppressClickUntil.current) return
    // A contained image can leave wide empty gutters inside its element.
    // Only the painted image toggles zoom; its left/right gutters navigate.
    const image = event.currentTarget.querySelector<HTMLImageElement>(
      '.gallery-frame[data-visible="true"] img',
    )
    if (!image?.naturalWidth) return
    const rect = image.getBoundingClientRect()
    const style = getComputedStyle(image)
    const width = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const height = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const left =
      rect.left + parseFloat(style.paddingLeft) + (width - image.naturalWidth * scale) / 2
    const right = left + image.naturalWidth * scale
    const top = rect.top + parseFloat(style.paddingTop) + (height - image.naturalHeight * scale) / 2
    const bottom = top + image.naturalHeight * scale
    if (event.detail !== 0 && event.clientX < left) move(-1)
    else if (event.detail !== 0 && event.clientX > right) move(1)
    else if (event.detail === 0 || (event.clientY >= top && event.clientY <= bottom))
      setExpanded((value) => !value)
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
    <div className="work-viewer" onKeyDown={keys} onDragStart={(event) => event.preventDefault()}>
      <div
        className="work-stage"
        style={{ aspectRatio: ratios[selected] || 4 / 3 }}
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
          aria-haspopup="dialog"
          onClick={() => openViewer()}
        >
          <GalleryFrames
            images={urls}
            index={selected}
            title={title}
            priority
            onDimensions={(index, ratio) =>
              setRatios((previous) =>
                previous[index] === ratio ? previous : { ...previous, [index]: ratio },
              )
            }
            sizes="(max-width: 800px) 96vw, 70vw"
            warm
          />
        </button>
      </div>
      {images.length > 1 && (
        <div
          className="work-thumbnails work-preview-thumbnails"
          aria-label={text(locale, 'Другие фотографии картины', 'More artwork photos')}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={text(
                locale,
                `Открыть фотографию ${index + 1}`,
                `Open photo ${index + 1}`,
              )}
              aria-haspopup="dialog"
              onClick={() => openViewer(index)}
            >
              <Image src={image.url} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}
      <div className="work-gallery-actions">
        <ShareArtwork title={title} locale={locale} />
      </div>
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
        {hasOpened && (
          <>
            <div className="lightbox-toolbar">
              <span>
                {title} · {selected + 1} / {images.length}
              </span>
              <div className="lightbox-actions">
                <ShareArtwork title={title} locale={locale} />
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
              <button
                type="button"
                className="lightbox-image"
                aria-label={text(
                  locale,
                  expanded ? 'Уменьшить изображение' : 'Увеличить изображение',
                  expanded ? 'Reduce image' : 'Expand image',
                )}
                aria-pressed={expanded}
                onClick={imageClick}
              >
                <GalleryFrames images={urls} index={selected} title={title} sizes="100vw" warm />
              </button>
              {arrows()}
            </div>
            {images.length > 1 && (
              <div
                className="work-thumbnails lightbox-thumbnails"
                ref={thumbnailStrip}
                aria-hidden={expanded}
              >
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={text(locale, `Изображение ${index + 1}`, `Image ${index + 1}`)}
                    aria-pressed={selected === index}
                    tabIndex={expanded ? -1 : 0}
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
