from pydantic import BaseModel, Field

class CheckRequest(BaseModel):
    text: str = Field(..., min_length=1)

class CheckResponse(BaseModel):
    toxic: bool
    score: float

class HealthResponse(BaseModel):
    status: str


class ExtractEventRequest(BaseModel):
    text: str = Field(..., min_length=1)

class ExtractEventResponse(BaseModel):
    title: str | None = None
    start_at: str | None = None
    end_at: str | None = None
    location: str | None = None

class ExtractDeadlineResponse(BaseModel):
    title: str | None = None
    due_at: str | None = None


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


class CategorizeMessageRequest(BaseModel):
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)

class CategorizeMessageResponse(BaseModel):
    category: str
    requires_response: bool


class CalendarPlanRequest(BaseModel):
    question: str = Field(..., min_length=1)

class CalendarPlanResponse(BaseModel):
    need_events: bool
    need_deadlines: bool
    date_from: str
    date_to: str


class CalendarEventRef(BaseModel):
    title: str
    start_at: str
    end_at: str | None = None
    location: str | None = None

class CalendarDeadlineRef(BaseModel):
    title: str
    due_at: str

class CalendarAnswerRequest(BaseModel):
    question: str = Field(..., min_length=1)
    events: list[CalendarEventRef] = Field(default_factory=list)
    deadlines: list[CalendarDeadlineRef] = Field(default_factory=list)

class CalendarAnswerResponse(BaseModel):
    answer: str


class LlmToxicityRequest(BaseModel):
    text: str = Field(..., min_length=1)
    score: float

class LlmToxicityResponse(BaseModel):
    toxic: bool


class RephraseRequest(BaseModel):
    text: str = Field(..., min_length=1)

class RephraseResponse(BaseModel):
    text: str