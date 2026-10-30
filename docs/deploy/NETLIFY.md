# Публикация на Netlify

Сайт и админка работают в Next.js на Netlify; PostgreSQL, изображения и Google Auth — в Supabase.
Это серверное приложение: ручная загрузка папки, GitHub Pages и `output: export` не подходят.

## Репозиторий и сборка

1. Netlify → Import a Git repository → GitHub → `Lohengrin14/sophie`.
2. Production branch: `master`. Подготовленная версия приложения объединена в неё через PR.
3. Base directory пустая; build command `npm run build`; publish directory `.next`.
   Они заданы в `netlify.toml`, Node.js — 24.22.2.
4. Netlify подключает OpenNext автоматически; устанавливать сторонний runtime вручную не нужно.
5. До первой успешной сборки добавьте переменные ниже. Если импорт сразу запускает сборку,
   после заполнения переменных запустите её повторно.

После подключения GitHub мерж PR в `master` автоматически запускает production-сборку.
Изменения кода публикуйте через отдельную ветку и PR; повторное нажатие Deploy не требуется.
Сохранение работ, фото и информации о художнике в CMS не требует деплоя.

## Переменные окружения

Добавляются через Netlify UI → Project configuration → Environment variables.
Области должны включать **Builds** и **Functions**, контекст — **Production**.
Они не берутся из локальных `.env` и не должны попадать в Git.

Из `.env.preview.local` скопируйте значения:

```text
DATABASE_TARGET=supabase
STORAGE_TARGET=supabase
SUPABASE_DB_HOST
SUPABASE_DB_PORT
SUPABASE_DB_NAME
SUPABASE_DB_USER
SUPABASE_DB_PASSWORD
PAYLOAD_SECRET
S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_BUCKET_ARTWORKS
S3_BUCKET_REFERENCES
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Если названия buckets не заданы, по умолчанию используются `artworks` и `references`.
Для DB port/name стандартные значения — 5432 / postgres. Пул — 3 соединения на экземпляр;
его можно задать через `DATABASE_POOL_MAX`, минимум 2.

Вместо локального `DATABASE_SSL_CA_FILE` добавьте **DATABASE_SSL_CA** с полным текстом
`.local/prod-ca-2021.crt`, включая строки BEGIN/END CERTIFICATE и переносы строк.
Локального пути на сервере нет. TLS-проверка остаётся включённой.

Дополнительно:

```dotenv
GOOGLE_AUTH_ORIGIN=https://имя-проекта.netlify.app
NEXT_PUBLIC_DEMO_MODE=false
```

Если имя, псевдоним и контакты ещё не заданы через «Художник», перенесите нужные
`NEXT_PUBLIC_ARTIST_*` из локальных настроек. Данные админки имеют приоритет.
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL`, `LOCAL_CLOUD_PREVIEW` и локальный путь сертификата
переносить не нужно. Seed на сервере не запускается.

Используйте тот же PAYLOAD_SECRET и ту же БД, что в preview: сотрудники, Google-вход,
работы и изображения уже созданы, переносить их не нужно. Миграции выполняются отдельно
через `npm run db:preview:migrate`, не при запуске каждого serverless-экземпляра.

## Google-вход на публичном домене

В Supabase → Authentication → URL Configuration:

- Site URL: `https://имя-проекта.netlify.app`.
- Redirect URLs: добавьте `https://имя-проекта.netlify.app/api/admin-auth/google/callback**`.
- Локальный callback можно оставить для разработки.

В Google Cloud существующий callback `https://<project-ref>.supabase.co/auth/v1/callback`
остаётся прежним. Клиент и Google Client Secret повторно создавать не нужно.
Участники тестирования Google по-прежнему задаются в Audience → Test users.

## Загрузка фотографий

Netlify ограничивает бинарные запросы примерно 4,5 МБ. Для загрузок через сервер
задан запас: фото работы/художника — до 4 000 000 байт каждое, референсы заявки —
до 3 файлов с общей суммой до 4 000 000 байт. Фотографии галереи отправляются по одной.
Проверки и подсказки на клиенте и сервере согласованы. В дальнейшем более крупные
оригиналы потребуют отдельной реализации прямой авторизованной загрузки в Storage.

## Проверка после публикации

1. `/ru` и `/en`, страница добавленной картины, описание, нужная валюта или отсутствие цены.
2. `/admin/login`: вход через Google и штатный выход.
3. Загрузка нового небольшого фото в галерею и открытие его на сайте после сохранения.
4. Заявка на заказ с референсом: есть в админке; приватный файл недоступен гостю.
5. После повторного деплоя данные и фотографии остаются на месте в Supabase.

Тестовые deploy previews не подключайте к Production-секретам автоматически:
они не должны получать возможность менять ту же БД без явной настройки.

Источники: [Next.js на Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/),
[лимиты Functions](https://docs.netlify.com/build/functions/configuration/),
[переменные Functions](https://docs.netlify.com/build/functions/environment-variables/).
