import type { ServerComponentProps } from 'payload'
import { googleAuthSettings } from '@/lib/google-auth'

export function GoogleLogin({
  i18n,
  searchParams,
}: ServerComponentProps & { searchParams?: Record<string, unknown> }) {
  if (!googleAuthSettings()) return null
  const en = i18n.language === 'en'
  const error = searchParams?.google
  return (
    <div className="studio-google-login">
      {Boolean(error) && (
        <p role="alert">
          {error === 'denied'
            ? en
              ? 'Access is available to added staff only. Ask the administrator to check your email.'
              : 'Вход доступен только сотрудникам. Попросите администратора проверить вашу почту в разделе «Сотрудники».'
            : en
              ? 'Google sign-in was not completed. Try again or use your password.'
              : 'Не удалось войти через Google. Попробуйте ещё раз или используйте пароль.'}
        </p>
      )}
      <form action="/api/admin-auth/google" method="post">
        <button type="submit">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#4285F4"
              d="M43.61 24.46c0-1.36-.12-2.66-.35-3.91H24v7.4h11a9.4 9.4 0 0 1-4.08 6.16v5h6.6c3.86-3.55 6.09-8.79 6.09-14.65Z"
            />
            <path
              fill="#34A853"
              d="M24 44c5.5 0 10.12-1.82 13.5-4.89l-6.6-5c-1.83 1.23-4.18 1.97-6.9 1.97-5.3 0-9.8-3.58-11.41-8.4H5.77v5.15A20 20 0 0 0 24 44Z"
            />
            <path
              fill="#FBBC05"
              d="M12.59 27.68A12 12 0 0 1 12 24c0-1.28.22-2.52.59-3.68v-5.15H5.77A20 20 0 0 0 4 24c0 3.23.77 6.29 2.14 9l6.45-5.32Z"
            />
            <path
              fill="#EA4335"
              d="M24 11.92c3 0 5.69 1.03 7.81 3.05l5.86-5.86C34.12 5.8 29.5 4 24 4A20 20 0 0 0 5.77 15.17l6.82 5.15c1.61-4.82 6.11-8.4 11.41-8.4Z"
            />
          </svg>
          {en ? 'Sign in with Google' : 'Войти через Google'}
        </button>
      </form>
      <div className="studio-google-divider">
        {en ? 'or use your email and password' : 'или используйте почту и пароль'}
      </div>
    </div>
  )
}
