# Вход в админку через Google

Google-вход работает через Supabase Auth. Он открывает обычную сессию Payload:
действуют права сотрудника, штатное обновление сессии и выход из аккаунта.
Вход по почте и паролю остаётся доступен. Firebase не требуется.

## Настройка сервисов

1. В Google Auth Platform создайте OAuth client типа **Web application**.
2. В **Authorized redirect URIs** добавьте callback из Supabase → Authentication → Providers → Google:
   `https://<project-ref>.supabase.co/auth/v1/callback`.
   Это поле отличается от **Authorized JavaScript origins**.
3. В Supabase включите Google-провайдер, вставьте Google Client ID и Client Secret.
   Google Client Secret не нужен в приложении.
4. В Google Audience, пока приложение в Testing, добавьте Google-почты сотрудников в Test users.
5. В Supabase → Authentication → URL Configuration → Redirect URLs добавьте:
   `http://127.0.0.1:3001/api/admin-auth/google/callback**`.
   SDK добавляет идентификатор PKCE-потока в query string, поэтому для локальной проверки
   используется суффикс `**`. Для публикации добавьте аналогичный URL с точным HTTPS-доменом сайта.

## Переменные приложения

Для локальной версии с облачной базой — в игнорируемом `.env.preview.local`:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
GOOGLE_AUTH_ORIGIN=http://127.0.0.1:3001
```

Ключ берётся в Supabase → Settings → API Keys → Publishable key. Поддерживается и legacy **anon**.
**Secret / service_role** ключ для этой задачи не используется. S3-ключи — отдельные переменные.
Без этих трёх значений кнопка скрыта; вход по паролю продолжает работать.
После изменения env перезапустите `npm run preview:dev`.

В production задайте `GOOGLE_AUTH_ORIGIN=https://ваш-домен` и добавьте соответствующий callback
в разрешённые Redirect URLs Supabase. Origin задаётся явно: приложение не строит адрес возврата
из недоверенного Host. Для HTTPS сессионные и временные OAuth cookies имеют Secure.

## Доступ сотрудников

Первого администратора создайте через `/admin/create-first-user`, указав ту же почту,
которую используете в Google. Затем администратор создаёт остальных пользователей в «Сотрудники».
Google-вход допускает только существующие учётные записи с совпадающей подтверждённой Google-почтой.
Он не создаёт сотрудников и не меняет пароли, роли или права доступа. Блокировка аккаунта учитывается.

При удалении сотрудника доступ прекращается; изменение прав применяется на следующем запросе.
Записи в Supabase Authentication → Users сами по себе не дают доступа к админке.
База Payload остаётся источником сотрудников и разрешений.

## Проверка

- `npm test` — PKCE, проверка Google identity, защита маршрутов и отказы доступа.
- `npm run test:google-auth` — создаёт отдельную временную локальную БД, применяет миграции,
  проверяет реальные Payload-сессии, роли, изменение прав, refresh, logout и пароль,
  затем удаляет БД. База сайта и Supabase не изменяются.
- Вручную откройте `/admin/login` на порту 3001 и нажмите «Войти через Google».
  После выбора аккаунта должна открыться админка с правами этого сотрудника.
  Выбор аккаунта Google и согласие на вход остаются ручной проверкой.

OAuth использует PKCE с короткоживущей HttpOnly cookie. Код обменивается на сервере;
профиль проверяется через Supabase `getUser`, после чего создаётся сессия Payload.
Supabase access/refresh tokens не сохраняются в браузере. Ответы авторизации не кешируются.
