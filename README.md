# Keynote Stage

Кинематографичная 3D-среда для презентаций: слайды висят в тёмном пространстве, камера пролетает сквозь них.

## Запуск

```bash
pnpm install
pnpm dev          # http://localhost:3300
```

Сценарий по умолчанию — `public/scenarios/demo.json`. Другой: `http://localhost:3300/?s=имя` → `public/scenarios/имя.json`.

Управление: `→` / пробел / `PgDn` — вперёд, `←` / `PgUp` — назад, `Home` / `End`, `F` — полный экран, клик по правой части экрана — вперёд, по левой — назад.

## Сценарий

```json
{
  "title": "Название",
  "accent": "#5aa9ff",
  "slides": [
    { "layout": "title",   "kicker": "надпись сверху", "title": "Заголовок", "subtitle": "Подзаголовок" },
    { "layout": "section", "kicker": "01", "title": "Раздел", "subtitle": "Пояснение" },
    { "layout": "bullets", "kicker": "тема", "title": "Заголовок", "bullets": ["пункт", "пункт"] },
    { "layout": "stat",    "title": "Заголовок", "stats": [{ "value": "151", "label": "подпись" }] },
    { "layout": "media",   "title": "Заголовок", "image": "/media/файл.png", "caption": "подпись" },
    { "layout": "quote",   "quote": "Цитата", "author": "Автор" }
  ]
}
```

- `accent` можно задать и в отдельном слайде.
- Картинки кладутся в `public/media/`.

## Сборка для GitHub Pages

```bash
BASE_PATH=/имя-репозитория pnpm build   # статика в out/
```
