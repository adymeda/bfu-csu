from pydantic import BaseModel

class NotifyRequest(BaseModel):
    user_ids: list[int]
    text: str

class NotifyResponse(BaseModel):
    sent: int
    failed: int
    missing_users: list[int]

class LinkRequest(BaseModel):
    user_id: int
    code: str

class LinkResponse(BaseModel):
    linked: bool
    telegram_id: int

class HealthResponse(BaseModel):
    status: str