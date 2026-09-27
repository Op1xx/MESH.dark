# Публикация в Mozilla Add-ons (AMO)

Пошаговая инструкция: как подписать/опубликовать расширение и что заполнить
в карточке дополнения.

---

## 0. Что понадобится

- Аккаунт Firefox на <https://addons.mozilla.org>.
- Собранный архив: `bash build.sh` → `dist/mesh-dark-<version>.zip`
  (для загрузки на AMO нужен именно `.zip`; `.xpi` — тот же архив).
- Публичный `PRIVACY.md` (в репозитории) — URL вида
  `https://github.com/Op1xx/MESH.dark/blob/main/PRIVACY.md`.

Манифест уже содержит:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "mesh-dark@mesh-dark",
    "strict_min_version": "140.0",
    "data_collection_permissions": { "required": ["none"] }
  },
  "gecko_android": { "strict_min_version": "142.0" }
}
```

`strict_min_version` обязателен, потому что встроенное согласие на сбор данных
(`data_collection_permissions`) работает начиная с Firefox 140 (ПК) и 142
(Android). Для более старых версий AMO не даст загрузить расширение.

> `data_collection_url` в манифесте не существует: URL политики
> конфиденциальности задаётся **в карточке AMO** (поле «Privacy policy»).
> Поддерживаемые ключи `gecko`: `id`, `strict_min_version`,
> `strict_max_version`, `update_url`, `data_collection_permissions`;
> `gecko_android` принимает только `strict_min_version` и `strict_max_version`.

---

## 1. Канал «unlisted» (подпись без публикации) — быстрый путь

Подходит, если вы распространяете `.xpi` сами (GitHub Releases), а в каталоге
AMO дополнение не появляется.

1. Получите API-ключи: <https://addons.mozilla.org/developers/addon/api/key/>
   (JWT issuer / JWT secret).
2. Локально:

   ```bash
   export AMO_API_KEY="user:XXXXX:YYY"
   export AMO_API_SECRET="..."
   npx web-ext sign \
     --source-dir . \
     --channel unlisted \
     --api-key "$AMO_API_KEY" \
     --api-secret "$AMO_API_SECRET"
   ```

   Результат — подписанный `.xpi` в `web-ext-artifacts/`. Его можно
   устанавливать в любой Firefox (обычный, ESR, Android) двойным кликом.
3. Для CI добавьте секреты репозитория `AMO_API_KEY` и `AMO_API_SECRET` —
   воркфлоу `.github/workflows/release.yml` подпишет и приложит `.xpi` к релизу.

---

## 2. Канал «listed» (публикация в каталоге AMO)

1. <https://addons.mozilla.org/developers/addon/submit/> → **«On this site»**
   (публичное дополнение).
2. Загрузите `dist/mesh-dark-<version>.zip`.
3. Firefox автоматически сгенерирует `/manifest` и проверит его. Если версия
   `strict_min_version` меньше требуемой для используемых ключей — AMO
   отклонит загрузку; в этом проекте значения уже выставлены (140.0 / 142.0).
4. Заполните карточку (тексты ниже).
5. Отправьте на ревью. Обычно занимает от нескольких часов до нескольких дней.
6. После одобрения дополнение станет доступно по адресу
   `https://addons.mozilla.org/ru/firefox/addon/<slug>/`.

---

## 3. Тексты для карточки

### Название

`МЭШ · Тёмная тема`

### Краткое описание (summary, ≤ 250 символов)

```
Тёмная тема для Московской электронной школы (school.mos.ru): аккуратное оформление интерфейса, режим системной темы, 5 акцентных цветов, автокоррекция устаревших блоков и приглушение изображений.
```

### Полное описание

См. `amo/listing-ru.md` (русский) и `amo/listing-en.md` (английский).

### Категория

`Внешний вид` (Appearance) → тема оформления; дополнительно можно указать
`Образование` (Education), если доступно.

### Теги

`тёмная тема`, `dark theme`, `МЭШ`, `school.mos.ru`, `образование`,
`оформление`, `accessibility`

### Ссылки

- Домашняя страница: `https://github.com/Op1xx/MESH.dark`
- Поддержка: `https://github.com/Op1xx/MESH.dark/issues`
- Политика конфиденциальности:
  `https://github.com/Op1xx/MESH.dark/blob/main/PRIVACY.md`
- Лицензия: MIT

### Изображения

- Иконка: `icons/icon-128.png` (уже в архиве).
- Промо-картинки: `amo/promo-1280x800.png`, `amo/promo-440x280.png`.
- Скриншоты 1280×800 (или 640×400), 1–5 штук: см. `amo/screenshots/HOWTO.md`.

---

## 4. Разрешения — что написать ревьюеру

AMO попросит обоснование для каждого разрешения:

| Разрешение | Обоснование |
| --- | --- |
| `storage` | Сохранение настроек темы (режим, акцент, приглушение изображений) локально в браузере пользователя. |
| `*://school.mos.ru/*` (host) | Применение тёмной темы только на сайте Московской электронной школы. Доступа к другим сайтам нет. |

Дополнительно можно указать:

- Расширение **не собирает данные** (`data_collection_permissions.required = ["none"]`).
- Нет аналитики, телеметрии, рекламы и внешних сетевых запросов.
- Настройки дублируются в `localStorage` сайта `school.mos.ru` как быстрый
  кэш для исключения «мигания» темы при загрузке.

---

## 5. Обновление версии

1. Поднимите `version` в `manifest.json` (SemVer) и в `package.json`.
2. Опишите изменения в `CHANGELOG.md`.
3. Соберите: `bash build.sh`.
4. Загрузите новый `.zip` на AMO (listed) или подпишите заново (unlisted).

---

## 6. Чек-лист перед загрузкой

- [ ] `npx web-ext lint --source-dir . --warnings-as-errors` проходит без ошибок.
- [ ] `version` в `manifest.json` и `package.json` совпадают и увеличины.
- [ ] `PRIVACY.md` закоммичен, а ссылка на него добавлена в карточку AMO
      (поле «Privacy policy»).
- [ ] Ссылки на репозиторий `https://github.com/Op1xx/MESH.dark` актуальны.
- [ ] `CHANGELOG.md` обновлён.
- [ ] Тег `v<version>` создан и запушен (запустит `.github/workflows/release.yml`).
