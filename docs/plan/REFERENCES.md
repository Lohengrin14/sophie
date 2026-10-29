# Референсы и источники

Проверено 29 октября 2026. Сайты могут меняться. Ниже — наблюдения по опубликованным страницам и наша интерпретация для проекта, а не утверждения о конверсии или внутренней архитектуре этих сайтов. Полный визуальный аудит на устройствах не выполнялся; палитра проекта предложена отдельно.

## Сайты художников

| Референс | Что наблюдается на странице | Что берём в проект |
| --- | --- | --- |
| [Sophie Kate Art](https://sophiekateart.com/) | Самостоятельные входы Shop Available Art, Order Commission и Reach Out | Самый близкий пример наших трёх намерений: выбрать готовое, заказать, связаться |
| [Форма Sophie Kate](https://sophiekateart.com/pages/contact) | Инструкция сообщить размер, стиль, цвет, рамку и место доставки; затем общая форма | Превращаем эту инструкцию в структурированные поля с вариантами «не знаю», не заставляем сочинять письмо |
| [Emily Jeffords — готовые работы](https://www.emilyjeffords.com/available-work) | Фото, конкретная цена, размеры, материалы и пояснения о доставке | Содержательная карточка и прозрачное разделение цены картины и доставки |
| [Emily Jeffords — commissions](https://www.emilyjeffords.com/commissions) | Пошаговое объяснение выбора размера, ориентации и цветовых предпочтений | Сначала объясняем процесс, затем собираем пожелания; не копируем её цены, права или условия |
| [Lisa Congdon](https://lisacongdon.com/) | Магазин, знакомство с художником, коллекции и новости работ | Связываем авторский характер и каталог; не переносим весь объём разделов на небольшой сайт |
| [Sophie Tea Art](https://sophieteaart.com/) | Коллекции, магазин, информация об авторе, события и интерактивная кампания | Пример сильной авторской идентичности; насыщенную навигацию и интро не берём за основу нашего короткого пути к заявке |

Функциональный ориентир — Sophie Kate; подробность карточек и объяснение заказа — Emily Jeffords. Визуальное направление окончательно выбираем на работах друга. Референсы служат анализу: чужие фотографии, тексты, отзывы и брендинг в наш сайт не копируем.

## Первичные технические источники

| Код | Источник | Что подтверждает |
| --- | --- | --- |
| S1 | [Payload: What is Payload?](https://payloadcms.com/docs/getting-started/what-is-payload) | Next.js/TypeScript, админка, API, auth и файловые возможности |
| S2 | [Payload: PostgreSQL](https://payloadcms.com/docs/database/postgres) | Штатный PostgreSQL-адаптер, Drizzle и управление миграциями |
| S3 | [Payload: Localization](https://payloadcms.com/docs/configuration/localization) | Локализация контента по полям, отдельно от языка интерфейса |
| S4 | [Payload: Storage adapters](https://payloadcms.com/docs/upload/storage-adapters) | Возможность вынести файлы из приложения; не подтверждает приватность без настройки доступа |
| S5 | [Next.js: Internationalization](https://nextjs.org/docs/app/guides/internationalization) | Маршруты и выдача контента для разных языков |
| S6 | [next-intl: Routing setup](https://next-intl.dev/docs/routing/setup) | Организация локализованных маршрутов в App Router |
| S7 | [Payload: Jobs Queue](https://payloadcms.com/docs/jobs-queue/overview) | Хранение заданий и необходимость запуска обработчика; одной записи в очередь недостаточно |
| S8 | [Wagtail FAQ](https://wagtail.org/faqs/) | Ecommerce не входит в ядро, расширение возможно через Django |
| S9 | [Shopify: Online store](https://www.shopify.com/online) | Управляемый магазин и checkout как альтернатива собственной реализации |
| S10 | [WooCommerce: Variable products](https://woocommerce.com/document/variable-product/) | Вариации с собственными ценами и остатками в готовой товарной модели |
| S11 | [Telegram Bot API: sendMessage](https://core.telegram.org/bots/api#sendmessage) | API уведомлений требует адресата chat_id; профиль художника и получатель бота — разные настройки |
| S12 | [Payload: Local API](https://payloadcms.com/docs/local-api/overview) | `overrideAccess` по умолчанию true, доступ и транзакционный контекст нужно задавать осознанно |
| S13 | [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting) | Возможность собственного Node.js-размещения; детали хостинга требуют проверки |
| S14 | [Payload: Access control](https://payloadcms.com/docs/access-control/overview) | Настраиваемые ограничения на документы и операции |
| D1 | [Google Fonts: Manrope metadata](https://github.com/google/fonts/blob/main/ofl/manrope/METADATA.pb) | Кириллица, латиница и диапазон начертаний |
| D2 | [Google Fonts: Lora metadata](https://github.com/google/fonts/blob/main/ofl/lora/METADATA.pb) | Кириллица, латиница, лицензия OFL |

Возможности библиотек не означают, что наше приложение автоматически правильно обрабатывает деньги, права, резерв или загрузки. Конкретные гарантии подтверждаем сценариями из [ROADMAP.md](ROADMAP.md). Версии библиотек, цены сервисов и региональную доступность проверим перед соответствующим этапом реализации/деплоя.
