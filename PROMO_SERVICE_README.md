# Промо-сервис (Promo Service)

Микросервис для управления промокодами в платформе Inskins, построенный на NestJS с использованием Kafka для межсервисной коммуникации и MongoDB для хранения данных.

## 🚀 Возможности

- ✅ Создание и управление промокодами
- ✅ Активация промокодов пользователями
- ✅ Валидация сроков действия и лимитов использования
- ✅ Статистика по промокодам
- ✅ Kafka интеграция для событий
- ✅ MongoDB для хранения данных
- ✅ Health check эндпоинты
- ✅ TypeScript типизация
- ✅ Валидация данных с class-validator

## 📋 Структура промокода

```typescript
interface PromoCode {
  promoCode: string;      // Уникальное название промокода
  bonusAmount: number;    // Сумма бонуса в долларах
  usageCount: number;     // Количество использований
  maxUsages?: number;     // Максимальное количество использований
  status: 'active' | 'expired' | 'disabled';
  expiresAt?: Date;       // Дата истечения
  description?: string;   // Описание промокода
  createdBy?: string;     // Кто создал промокод
  isActive: boolean;      // Активен ли промокод
}
```

## 🏗️ Архитектура

Сервис следует принципам Clean Architecture:

```
src/
├── promo/                    # Основной модуль промокодов
│   ├── dto/                  # Data Transfer Objects
│   ├── schemas/              # Mongoose схемы
│   ├── repository/           # Репозиторий паттерн
│   ├── promo.service.ts      # Бизнес-логика
│   ├── promo.controller.ts   # Kafka контроллер
│   └── promo.module.ts       # NestJS модуль
├── common/                   # Общие компоненты
│   └── exceptions/           # Кастомные исключения
├── config/                   # Конфигурация
├── health/                   # Health checks
├── kafka/                    # Kafka сервис
└── main.ts                   # Точка входа
```

## 🛠️ Технологический стек

- **NestJS** - Node.js фреймворк
- **TypeScript** - Типизированный JavaScript
- **MongoDB + Mongoose** - База данных и ODM
- **Kafka** - Система сообщений
- **class-validator** - Валидация данных
- **Docker** - Контейнеризация

## 📡 Kafka Events

### Исходящие события:
- `promo.created` - Промокод создан
- `promo.activated` - Промокод активирован
- `promo.expired` - Промокод истек
- `balance.updated` - Баланс пользователя обновлен

### Входящие события:
- `user.registered` - Новый пользователь зарегистрирован

## 🔌 API (Kafka Messages)

### Управление промокодами:
- `promo.create` - Создать промокод
- `promo.findById` - Найти по ID
- `promo.findByCode` - Найти по коду
- `promo.findAll` - Получить все промокоды
- `promo.update` - Обновить промокод
- `promo.delete` - Удалить промокод
- `promo.activate` - Активировать промокод
- `promo.stats` - Статистика

### Health checks:
- `health.check` - Проверка здоровья
- `health.ready` - Готовность
- `health.live` - Живучесть

## 🚀 Запуск

### Локальная разработка

1. **Установка зависимостей:**
```bash
npm install
```

2. **Настройка переменных окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл
```

3. **Запуск с Docker Compose:**
```bash
docker-compose up -d
```

4. **Запуск в dev режиме:**
```bash
npm run start:dev
```

### Переменные окружения

```bash
# Сервер
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/promo-service

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=promo-service
KAFKA_CONSUMER_GROUP_ID=promo-service-group

# Redis (опционально)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📊 Мониторинг

### Health Check эндпоинты:
- `GET /health` - Общее состояние сервиса
- `GET /health/ready` - Готовность к работе
- `GET /health/live` - Проверка живучести

### Пример ответа health check:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0",
  "services": {
    "mongodb": {
      "status": "connected",
      "ready": true
    }
  }
}
```

## 🔧 Разработка

### Создание промокода (пример):
```bash
# Через Kafka
kafka-console-producer --topic promo.create --bootstrap-server localhost:9092

# Сообщение:
{
  "promoCode": "WELCOME2024",
  "bonusAmount": 10.00,
  "maxUsages": 1000,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "description": "Приветственный промокод"
}
```

### Активация промокода:
```bash
# Через Kafka
kafka-console-producer --topic promo.activate --bootstrap-server localhost:9092

# Сообщение:
{
  "promoCode": "WELCOME2024",
  "userId": "user123"
}
```

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov
```

## 📦 Деплой

### Docker

1. **Сборка образа:**
```bash
docker build -t promo-service .
```

2. **Запуск контейнера:**
```bash
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://mongo:27017/promo-service \
  -e KAFKA_BROKERS=kafka:9092 \
  promo-service
```

### Production

1. **Сборка:**
```bash
npm run build
```

2. **Запуск:**
```bash
npm run start:prod
```

## 🔒 Безопасность

- Валидация всех входящих данных
- Санитизация промокодов (uppercase)
- Проверка лимитов использования
- Контроль сроков действия
- Обработка ошибок без утечки данных

## 📝 Логирование

Сервис использует встроенное логирование NestJS:
- Уровни: error, warn, log, debug, verbose
- Структурированные логи для важных событий
- Логирование всех Kafka событий

## 🤝 Интеграция с другими сервисами

- **User Service** - получение событий регистрации пользователей
- **Balance Service** - обновление баланса при активации промокодов
- **Notification Service** - уведомления об активации промокодов

## 📈 Метрики и мониторинг

- Health check эндпоинты для k8s
- Статистика по промокодам
- Мониторинг Kafka соединений
- Проверка состояния MongoDB

## 🔄 CI/CD

Готов к интеграции с:
- GitHub Actions
- GitLab CI
- Jenkins
- Docker Registry
- Kubernetes

## 🐛 Устранение неполадок

### Частые проблемы:

1. **Kafka не подключается:**
   - Проверьте KAFKA_BROKERS
   - Убедитесь что Kafka запущен

2. **MongoDB ошибки:**
   - Проверьте MONGODB_URI
   - Убедитесь что MongoDB доступна

3. **Валидация промокодов:**
   - Проверьте формат данных
   - Убедитесь в уникальности промокода

## 📞 Поддержка

При возникновении вопросов или проблем:
- Создайте issue в репозитории
- Проверьте логи сервиса
- Используйте health check эндпоинты для диагностики 