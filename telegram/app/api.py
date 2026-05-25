import asyncio
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from telegram import Bot
from telegram.error import BadRequest, Forbidden, RetryAfter

from .db import async_session_factory
from .schemas import HealthResponse, LinkRequest, LinkResponse, NotifyRequest, NotifyResponse
from .security import require_service_token
from .config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

def _get_bot(request: Request) -> Bot:
    return request.app.state.bot

@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    async with async_session_factory() as session:
        await session.execute(text("SELECT 1"))
    return HealthResponse(status="ok")

@router.post(
    "/notify",
    response_model=NotifyResponse,
    dependencies=[Depends(require_service_token)],
)
async def notify(body: NotifyRequest, request: Request) -> NotifyResponse:
    bot: Bot = _get_bot(request)

    async with async_session_factory() as session:
        result = await session.execute(
            text(
                "SELECT user_id, link_value FROM links "
                "WHERE link_type = 1 AND user_id = ANY(:ids)"
            ),
            {"ids": body.user_ids},
        )
        rows = result.fetchall()

    linked_user_ids = {row.user_id for row in rows}
    missing_users = [uid for uid in body.user_ids if uid not in linked_user_ids]

    sent = 0
    failed = 0

    for row in rows:
        chat_id = int(row.link_value)
        try:
            await bot.send_message(chat_id=chat_id, text=body.text)
            sent += 1
        except RetryAfter as e:
            await asyncio.sleep(e.retry_after)
            try:
                await bot.send_message(chat_id=chat_id, text=body.text)
                sent += 1
            except Exception as retry_err:
                logger.warning("Retry failed for chat_id=%s: %s", chat_id, retry_err)
                failed += 1
        except (Forbidden, BadRequest) as e:
            logger.warning("Cannot send to chat_id=%s: %s", chat_id, e)
            failed += 1
        except Exception as e:
            logger.error("Unexpected error for chat_id=%s: %s", chat_id, e)
            failed += 1

        await asyncio.sleep(0.05)

    return NotifyResponse(sent=sent, failed=failed, missing_users=missing_users)

@router.post(
    "/link",
    response_model=LinkResponse,
    dependencies=[Depends(require_service_token)],
)
async def link(body: LinkRequest, request: Request) -> LinkResponse:
    bot: Bot = _get_bot(request)
    ttl = timedelta(minutes=settings.code_ttl_minutes)

    async with async_session_factory() as session:
        async with session.begin():
            result = await session.execute(
                text("SELECT telegram_id, created_at FROM pending_links WHERE code = :code"),
                {"code": body.code},
            )
            row = result.fetchone()

            if row is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="code_not_found",
                )

            created_at: datetime = row.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) - created_at > ttl:
                await session.execute(
                    text("DELETE FROM pending_links WHERE code = :code"),
                    {"code": body.code},
                )
                raise HTTPException(
                    status_code=status.HTTP_410_GONE,
                    detail="code_expired",
                )

            telegram_id: int = row.telegram_id

            await session.execute(
                text(
                    "INSERT INTO links (user_id, link_type, link_value) "
                    "VALUES (:user_id, 1, :telegram_id) "
                    "ON CONFLICT (user_id, link_type) DO UPDATE "
                    "SET link_value = EXCLUDED.link_value"
                ),
                {"user_id": body.user_id, "telegram_id": str(telegram_id)},
            )

            await session.execute(
                text("DELETE FROM pending_links WHERE code = :code"),
                {"code": body.code},
            )

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text="Ваш аккаунт успешно привязан! Теперь вы будете получать уведомления в этом чате",
        )
    except Exception as e:
        logger.warning("Could not send confirmation to telegram_id=%s: %s", telegram_id, e)

    return LinkResponse(linked=True, telegram_id=telegram_id)