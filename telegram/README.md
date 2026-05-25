# Telegram-микросервис BFU-CSU

## Быстрый старт

```bash
cd telegram

# Создать виртуальное окружение и установить зависимости
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Настроить окружение
cp .env.example .env
# Заполнить BOT_TOKEN и SERVICE_TOKEN в .env

# Запустить
python -m app.main
```

Сервис поднимается на порту **3910** (порт 3909 занят backend)

## API

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|----------|
| GET | `/api/health` | нет | Проверка работоспособности |
| POST | `/api/notify` | Bearer SERVICE_TOKEN | Разослать уведомления по user_id |
| POST | `/api/link` | Bearer SERVICE_TOKEN | Привязать аккаунт к Telegram по коду |

### POST /api/notify

```json
{ "user_ids": [1, 2, 3], "text": "Текст уведомления" }
```

### POST /api/link

```json
{ "user_id": 42, "code": "ABCDEFGH" }
```

## Привязка аккаунта

1. Пользователь пишет боту `/start` — получает 8-значный код
2. Код вводится в веб-интерфейсе → backend вызывает `POST /api/link`
3. При успехе бот отправляет подтверждение в Telegram