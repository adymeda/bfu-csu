import asyncio

from fastapi import APIRouter, Depends

from ..config import settings
from ..models import get_toxicity_model
from ..schemas import CheckRequest, CheckResponse
from ..security import require_service_token

router = APIRouter(prefix="/api")

@router.post(
	"/check",
	response_model=CheckResponse,
	dependencies=[Depends(require_service_token)],
)
async def check_toxicity(body: CheckRequest) -> CheckResponse:
	model = get_toxicity_model()
	probe = await asyncio.to_thread(model.predict_proba, [body.text])
	score: float = float(probe[0][1])
	return CheckResponse(toxic=score >= settings.toxicity_threshold, score=round(score, 4))