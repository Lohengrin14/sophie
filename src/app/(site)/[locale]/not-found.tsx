import Link from 'next/link'
export default function NotFound() {
  return (
    <main id="main" className="container page-main empty-state">
      <p className="eyebrow">404</p>
      <h1>Эта страница пока не написана.</h1>
      <p>This page hasn’t been painted yet.</p>
      <Link className="button primary" href="/ru">
        На главную / Home
      </Link>
    </main>
  )
}
