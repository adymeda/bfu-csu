import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI

from .config import settings
from .models import get_toxicity_model
from .routers import toxicity

logging.basicConfig(
	level=logging.INFO,
	format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
	logger.info("Loading toxicity model from %s...", settings.model_path)
	get_toxicity_model()
	logger.info("Model loaded")
	yield

def build_app() -> FastAPI:
	app = FastAPI(title="BFU-CSU ML Service", lifespan=lifespan)
	app.include_router(toxicity.router)
	return app

app = build_app()

if __name__ == "__main__":
	uvicorn.run(
		"app.main:app",
		host=settings.host,
		port=settings.port,
		log_level="info",
	)