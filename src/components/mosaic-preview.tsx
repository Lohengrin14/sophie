'use client'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { CatalogItem } from '@/lib/catalog-item'
import { boardSize } from '@/lib/canvas-size'
import { previewRect } from '@/lib/gallery-view'
import { text, type Locale } from '@/lib/i18n'
import { GalleryFrames } from './gallery-frames'

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
  const slot = useRef<HTMLDivElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [active, setActive] = useState(false)
  const [current, setCurrent] = useState(0)
  const [transform, setTransform] = useState('translate3d(0,0,0) scale(1)')
  const [reduceMotion, setReduceMotion] = useState(false)
  const images = work.images?.length ? work.images : [work.image].filter(Boolean)
  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  function close(immediate = false) {
    clearTimers()
    const finish = () => {
      setActive(false)
      setCurrent(0)
      setTransform('translate3d(0,0,0) scale(1)')
    }
    if (immediate) finish()
    else closeTimer.current = setTimeout(finish, 130)
  }
  function open(immediate = false) {
    clearTimers()
    const start = () => {
      if (!slot.current) return
      const base = slot.current.getBoundingClientRect()
      const header = document.querySelector('.site-header')?.getBoundingClientRect()
      const expanded = previewRect(
        base,
        { width: document.documentElement.clientWidth, height: window.innerHeight },
        Math.max(8, header?.bottom || 8) + 8,
      )
      setTransform(
        `translate3d(${expanded.left - base.left}px,${expanded.top - base.top}px,0) scale(${expanded.width / Math.max(1, base.width)})`,
      )
      setActive(true)
    }
    if (immediate) start()
    else openTimer.current = setTimeout(start, 100)
  }
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => {
      query.removeEventListener('change', update)
      clearTimers()
    }
  }, [])
  useEffect(() => {
    if (!active || reduceMotion || images.length < 2) return
    let interval: ReturnType<typeof setInterval> | undefined
    const timer = setTimeout(() => {
      setCurrent((index) => (index + 1) % images.length)
      interval = setInterval(() => setCurrent((index) => (index + 1) % images.length), 2600)
    }, 1300)
    return () => {
      clearTimeout(timer)
      if (interval) clearInterval(interval)
    }
  }, [active, reduceMotion, images.length])
  useEffect(() => {
    if (!active) return
    const reset = () => close(true)
    window.addEventListener('scroll', reset, { passive: true })
    window.addEventListener('resize', reset)
    return () => {
      window.removeEventListener('scroll', reset)
      window.removeEventListener('resize', reset)
    }
  }, [active])
  return (
    <Link
      id={`work-${work.id}`}
      href={`/${locale}/works/${work.slug}`}
      className={`mosaic-work ${active ? 'is-previewing' : ''}`}
      style={style}
      data-canvas-tier={boardSize(work.displaySize).tier}
      aria-label={text(locale, `Посмотреть картину «${work.title}»`, `View “${work.title}”`)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') open()
      }}
      onPointerLeave={() => close()}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch') open(true)
      }}
      onPointerUp={(event) => {
        if (event.pointerType === 'touch') close(true)
      }}
      onPointerCancel={() => close(true)}
      onFocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) open(true)
      }}
      onBlur={() => close()}
      onContextMenu={(event) => {
        if (window.matchMedia('(pointer: coarse)').matches) event.preventDefault()
      }}
    >
      <div className="mosaic-image" ref={slot}>
        <div className="mosaic-visual" style={{ transform }}>
          <GalleryFrames
            images={images}
            index={current}
            title={work.title}
            priority={priority}
            warm={active && !reduceMotion}
            sizes="(max-width: 700px) 94vw, (max-width: 1100px) 62vw, 55vw"
          />
          {images.length > 1 && (
            <span className="mosaic-preview-count" aria-hidden="true">
              {current + 1} / {images.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
