import asyncio
import logging
import secrets
import string

from sqlalchemy import select, text
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from .config import settings
from .db import async_session_factory
from .models import PendingLink

logger = logging.getLogger(__name__)

_CODE_ALPHABET = string.ascii_uppercase + string.digits

def _generate_code(length: int) -> str:
    return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))

async def _get_or_create_code(telegram_id: int) -> str:
    code = _generate_code(settings.code_length)
    async with async_session_factory() as session:
        async with session.begin():
            await session.execute(
                text(
                    "INSERT INTO pending_links (telegram_id, code, created_at) "
                    "VALUES (:tid, :code, now()) "
                    "ON CONFLICT (telegram_id) DO UPDATE "
                    "SET code = EXCLUDED.code, created_at = now()"
                ),
                {"tid": telegram_id, "code": code},
            )
    return code

async def _is_already_linked(telegram_id: int) -> bool:
    async with async_session_factory() as session:
        result = await session.execute(
            text(
                "SELECT 1 FROM links WHERE link_type = 1 AND link_value = :tid LIMIT 1"
            ),
            {"tid": str(telegram_id)},
        )
        return result.scalar() is not None

async def on_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id

    if await _is_already_linked(chat_id):
        await update.message.reply_text(
            "Ваш аккаунт уже привязан к системе коммуникации БФУ им. И. Канта.\n"
            "Вы будете получать уведомления в этом чате."
        )
        return

    code = await _get_or_create_code(chat_id)
    await update.message.reply_text(
        f"Для привязки аккаунта введите следующий код в настройках профиля:\n\n"
        f"<code>{code}</code>\n\n"
        f"Код действителен {settings.code_ttl_minutes} минут.",
        parse_mode="HTML",
    )

async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await on_start(update, context)

def build_application() -> Application:
    app = Application.builder().token(settings.bot_token).build()
    app.add_handler(CommandHandler("start", on_start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
    return app