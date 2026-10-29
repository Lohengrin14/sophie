import Image from 'next/image'
import type { CSSProperties } from 'react'
import { canvasSize } from '@/lib/canvas-size'

export function CanvasImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  className = '',
}: {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  sizes: string
  className?: string
}) {
  const size = canvasSize(width, height)
  return (
    <div
      className={`canvas-stage ${className}`}
      data-canvas-tier={size.tier}
      style={{ '--canvas-size': `${size.scale * 50}%` } as CSSProperties}
    >
      <div className="canvas-fit">
        {src && <Image src={src} alt={alt} fill priority={priority} sizes={sizes} />}
      </div>
    </div>
  )
}
