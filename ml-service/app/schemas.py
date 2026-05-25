from pydantic import BaseModel, Field

class CheckRequest(BaseModel):
	text: str = Field(..., min_length=1)

class CheckResponse(BaseModel):
	toxic: bool
	score: float

class HealthResponse(BaseModel):
	status: str