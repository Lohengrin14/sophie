'use client'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Palette, Check } from 'lucide-react'
import {
  THEME_COOKIE,
  resolveTheme,
  siteThemes,
  themeVariables,
  type ThemeId,
} from '@/lib/site-themes'
import { text, type Locale } from '@/lib/i18n'

export function ThemePicker({
  initialTheme,
  locale,
  onOpen,
}: {
  initialTheme: ThemeId
  locale: Locale
  onOpen: () => void
}) {
  const [selected, setSelected] = useState(initialTheme)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const current = resolveTheme(selected)
  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  function choose(id: ThemeId) {
    const theme = resolveTheme(id)
    for (const [key, value] of Object.entries(themeVariables(theme))) {
      if (key === 'colorScheme') document.documentElement.style.colorScheme = value
      else document.documentElement.style.setProperty(key, value)
    }
    document.documentElement.dataset.siteTheme = theme.id
    setSelected(theme.id)
    try {
      document.cookie = `${THEME_COOKIE}=${theme.id}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    } catch {
      /* The palette still works if preference storage is blocked. */
    }
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    const position = siteThemes.findIndex((theme) => theme.id === selected)
    let index = position
    const columns = window.matchMedia('(min-width: 801px)').matches ? 2 : 1
    if (event.key === 'ArrowRight') index = (position + 1) % siteThemes.length
    else if (event.key === 'ArrowLeft')
      index = (position + siteThemes.length - 1) % siteThemes.length
    else if (event.key === 'ArrowDown') index = (position + columns) % siteThemes.length
    else if (event.key === 'ArrowUp')
      index = (position + siteThemes.length - columns) % siteThemes.length
    else if (event.key === 'Home') index = 0
    else if (event.key === 'End') index = siteThemes.length - 1
    else return
    event.preventDefault()
    choose(siteThemes[index].id)
    root.current
      ?.querySelector<HTMLButtonElement>(`[data-palette="${siteThemes[index].id}"]`)
      ?.focus()
  }
  return (
    <div
      className="theme-picker"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="theme-trigger"
        aria-label={text(locale, `Палитра: ${current.name.ru}`, `Palette: ${current.name.en}`)}
        title={text(locale, 'Палитра сайта', 'Site palette')}
        aria-expanded={open}
        aria-controls="site-palettes"
        onClick={() => {
          if (!open) onOpen()
          setOpen((value) => !value)
        }}
      >
        <Palette size={19} />
      </button>
      {open && (
        <section
          className="theme-panel"
          id="site-palettes"
          aria-label={text(locale, 'Палитра сайта', 'Site palette')}
        >
          <div className="theme-panel-heading">{text(locale, 'Палитра сайта', 'Site palette')}</div>
          <div role="radiogroup" aria-label={text(locale, 'Темы', 'Themes')} onKeyDown={keys}>
            {siteThemes.map((theme, index) => (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={selected === theme.id}
                data-palette={theme.id}
                tabIndex={selected === theme.id ? 0 : -1}
                onClick={() => choose(theme.id)}
                className="theme-option"
              >
                <span className="theme-swatches" aria-hidden="true">
                  {[
                    theme.colors.bg,
                    theme.colors.header,
                    theme.colors.ink,
                    theme.colors.accent,
                  ].map((color, index) => (
                    <i key={index} style={{ background: color }} />
                  ))}
                </span>
                <span className="theme-option-copy">
                  <strong>
                    {index + 1}. {theme.name[locale]}
                  </strong>
                  <small>{theme.note[locale]}</small>
                </span>
                {selected === theme.id && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
