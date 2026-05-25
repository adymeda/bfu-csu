import asyncio
import logging

import uvicorn
from fastapi import FastAPI
from telegram.ext import Application

from .api import router
from .bot import build_application
from .config import settings
from .db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

def build_fastapi(application: Application) -> FastAPI:
    app = FastAPI(title="BFU-CSU Telegram Service")
    app.state.bot = application.bot
    app.include_router(router)
    return app

async def main() -> None:
    await init_db()
    logger.info("Database initialised")

    application = build_application()
    fastapi_app = build_fastapi(application)

    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    logger.info("Telegram bot started (polling)")

    config = uvicorn.Config(
        fastapi_app,
        host=settings.host,
        port=settings.port,
        log_level="info",
    )
    server = uvicorn.Server(config)

    try:
        await server.serve()
    finally:
        logger.info("Shutting down Telegram bot...")
        await application.updater.stop()
        await application.stop()
        await application.shutdown()

if __name__ == "__main__":
    asyncio.run(main())