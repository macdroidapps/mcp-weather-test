# Weather Chat - Next.js

Веб-интерфейс чата с AI-ассистентом по погоде.

## Запуск

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка для продакшена
npm run build
npm start
```

## Переменные окружения

Создайте файл `.env.local`:

```env
# Яндекс Weather API
YANDEX_WEATHER_API_KEY=ваш-ключ

# Anthropic Claude API
ANTHROPIC_API_KEY=ваш-ключ
```

## API Endpoints

### POST /api/weather
Получение погоды для города.

```bash
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"city": "Рига"}'
```

### POST /api/chat
Чат с AI-ассистентом.

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Какая погода в Москве?"}'
```

## Технологии

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Яндекс Weather API

