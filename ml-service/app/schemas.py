from pydantic import BaseModel, Field

class CheckRequest(BaseModel):
    text: str = Field(..., min_length=1)

class CheckResponse(BaseModel):
    toxic: bool
    score: float

class HealthResponse(BaseModel):
    status: str


class ExtractEventResponse(BaseModel):
    is_deadline: bool = False
    title: str | None = None
    start_at: str | None = None
    end_at: str | None = None
    location: str | None = None

class ExtractEventRequest(BaseModel):
    text: str = Field(..., min_length=1)


class EmployeeRef(BaseModel):
    position: str
    group: str

class ComposeMessageRequest(BaseModel):
    description: str = Field(..., min_length=1)
    author_groups: list[str] = Field(default_factory=list)

class ComposeMessageResponse(BaseModel):
    subject: str
    body: str
    users: list[str] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list)
    employees: list[EmployeeRef] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class MessageRef(BaseModel):
    sender_name: str
    body: str
    created_at: str
    is_read: bool

class SummarizeInboxRequest(BaseModel):
    messages: list[MessageRef] = Field(..., min_length=1)

class SummarizeInboxResponse(BaseModel):
    summary: str