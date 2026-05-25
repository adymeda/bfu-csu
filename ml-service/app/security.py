from fastapi import Header, HTTPException, status
from .config import settings

async def require_service_token(authorization: str = Header(...)) -> None:
	scheme, _, token = authorization.partition(" ")
	if scheme.lower() != "bearer" or token != settings.service_token:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token")