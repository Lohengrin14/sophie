'use client'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { CatalogItem } from '@/lib/catalog-item'
import { boardSize } from '@/lib/canvas-size'
import { previewRect, type ViewRect } from '@/lib/gallery-view'
import { text, type Locale } from '@/lib/i18n'

export function MosaicPreview({
  work,
  locale,
  style,
  priority,
}: {
  work: CatalogItem
  locale: Locale
  style: CSSProperties
  priority: boolean
}) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<ViewRect | null>(null)
  const [current, setCurrent] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const images = work.images?.length ? work.images : [work.image].filter(Boolean)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const stop = () => {
    setBounds(null)
    setCurrent(0)
  }
  function start() {
    if (!imageRef.current || !images.length) return
    const rect = imageRef.current.getBoundingClientRect()
    const header = document.querySelector('.site-header')?.getBoundingClientRect()
    setBounds(
      previewRect(
        rect,
        { width: document.documentElement.clientWidth, height: window.innerHeight },
        Math.max(8, header?.bottom || 8) + 8,
      ),
    )
  }
  useEffect(() => {
    if (!bounds) return
    const stop = () => {
      setBounds(null)
      setCurrent(0)
    }
    window.addEventListener('scroll', stop, { passive: true, capture: true })
    window.addEventListener('resize', stop)
    return () => {
      window.removeEventListener('scroll', stop, true)
      window.removeEventListener('resize', stop)
    }
  }, [bounds])
  useEffect(() => {
    if (!bounds || images.length < 2 || reduceMotion) return
    let interval: ReturnType<typeof setInterval> | undefined
    const delay = setTimeout(() => {
      setCurrent((index) => (index + 1) % images.length)
      interval = setInterval(() => setCurrent((index) => (index + 1) % images.length), 1600)
    }, 900)
    return () => {
      clearTimeout(delay)
      if (interval) clearInterval(interval)
    }
  }, [Boolean(bounds), images.length, reduceMotion])
  function enter(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'mouse') start()
  }
  return (
    <Link
      id={`work-${work.id}`}
      href={`/${locale}/works/${work.slug}`}
      className="mosaic-work"
      style={style}
      data-canvas-tier={boardSize(work.displaySize).tier}
      aria-label={text(locale, `Посмотреть картину «${work.title}»`, `View “${work.title}”`)}
      onPointerEnter={enter}
      onPointerLeave={stop}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch') start()
      }}
      onPointerUp={(event) => {
        if (event.pointerType === 'touch') stop()
      }}
      onPointerCancel={stop}
      onContextMenu={(event) => {
        if (window.matchMedia('(pointer: coarse)').matches) event.preventDefault()
      }}
      onFocus={start}
      onBlur={stop}
    >
      <div className="mosaic-image" ref={imageRef} style={{ opacity: bounds ? 0 : 1 }}>
        {work.image && (
          <Image
            src={work.image}
            alt={work.title}
            fill
            priority={priority}
            sizes="(max-width: 700px) 94vw, (max-width: 1100px) 62vw, 50vw"
          />
        )}
      </div>
      {bounds &&
        createPortal(
          <div className="mosaic-preview" style={bounds} aria-hidden="true">
            {images.map(
              (src, index) =>
                (index === current ||
                  (!reduceMotion &&
                    (index === (current + 1) % images.length ||
                      index === (current + images.length - 1) % images.length))) && (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    fill
                    loading="eager"
                    sizes="(max-width: 700px) 100vw, 60vw"
                    className={`mosaic-preview-photo ${index === current ? 'is-current' : ''}`}
                  />
                ),
            )}
            {images.length > 1 && (
              <span className="mosaic-preview-count">
                {current + 1} / {images.length}
              </span>
            )}
          </div>,
          document.body,
        )}
    </Link>
  )
}
