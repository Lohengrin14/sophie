'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

// Keep the previous decoded frame visible while its replacement loads. Stable
// DOM nodes let CSS crossfade both layers without remounting either photograph.
export function GalleryFrames({
  images,
  index,
  title,
  sizes,
  priority = false,
  warm = false,
}: {
  images: string[]
  index: number
  title: string
  sizes: string
  priority?: boolean
  warm?: boolean
}) {
  const [visible, setVisible] = useState(index)
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([index]))
  const [ready, setReady] = useState<Set<number>>(() => new Set())
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    setMounted((previous) => {
      const next = new Set(previous)
      next.add(index)
      if (warm && images.length > 1) next.add((index + 1) % images.length)
      return next.size === previous.size ? previous : next
    })
  }, [index, warm, images.length])
  useEffect(() => {
    if (ready.has(index)) setVisible(index)
  }, [index, ready])
  return (
    <span className="gallery-frames" aria-busy={!ready.has(index)}>
      {images.map(
        (src, position) =>
          mounted.has(position) && (
            <span
              key={`${position}-${src}`}
              className="gallery-frame"
              data-visible={position === visible}
              aria-hidden={position !== visible}
            >
              <Image
                src={src}
                alt={position === visible ? title : ''}
                fill
                sizes={sizes}
                priority={priority && position === 0}
                loading={
                  priority && position === 0
                    ? undefined
                    : position === 0 && !warm
                      ? 'lazy'
                      : 'eager'
                }
                draggable={false}
                onLoad={async (event) => {
                  const image = event.currentTarget
                  try {
                    await image.decode()
                  } catch {}
                  if (alive.current && image.naturalWidth > 0)
                    setReady((previous) => new Set(previous).add(position))
                }}
              />
            </span>
          ),
      )}
    </span>
  )
}
