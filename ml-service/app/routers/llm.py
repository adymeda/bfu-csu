import json
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from gigachat import GigaChatAsyncClient, AuthenticationError, Chat, Messages, MessagesRole

from ..config import settings
from ..prompts import (
    CALENDAR_ANSWER_SYSTEM_PROMPT,
    CALENDAR_PLAN_SYSTEM_PROMPT,
    CATEGORIZE_MESSAGE_SYSTEM_PROMPT,
    CHECK_TOXICITY_SYSTEM_PROMPT,
    COMPOSE_MESSAGE_SYSTEM_PROMPT,
    EXTRACT_DEADLINE_SYSTEM_PROMPT,
    EXTRACT_EVENT_SYSTEM_PROMPT,
    REPHRASE_SYSTEM_PROMPT,
    SUMMARIZE_INBOX_SYSTEM_PROMPT,
)
from ..schemas import (
    CalendarAnswerRequest,
    CalendarAnswerResponse,
    CalendarPlanRequest,
    CalendarPlanResponse,
    CategorizeMessageRequest,
    CategorizeMessageResponse,
    ComposeMessageRequest,
    ComposeMessageResponse,
    EmployeeRef,
    ExtractDeadlineResponse,
    ExtractEventRequest,
    ExtractEventResponse,
    LlmToxicityRequest,
    LlmToxicityResponse,
    RephraseRequest,
    RephraseResponse,
    SummarizeInboxRequest,
    SummarizeInboxResponse,
)
from ..security import require_service_token

router = APIRouter(
    prefix="/api/llm",
    dependencies=[Depends(require_service_token)],
)

def _client() -> GigaChatAsyncClient:
    return GigaChatAsyncClient(
        credentials=settings.gigachat_api_key,
        model=settings.gigachat_model,
        verify_ssl_certs=False,
        scope="GIGACHAT_API_PERS",
    )

def _inject_date(prompt: str) -> str:
    return prompt.replace("{today}", date.today().isoformat())

def _extract_json(text: str) -> dict:
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    raw = match.group(1) if match else text.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_invalid_json")

def _apply_default_duration(start_at: str | None, end_at: str | None) -> str | None:
    """Fallback: if LLM forgot to compute end_at, do it in Python."""
    if start_at and not end_at:
        return (datetime.fromisoformat(start_at) + timedelta(minutes=90)).isoformat()
    return end_at

async def _chat(system: str, user: str) -> dict:
    try:
        async with _client() as client:
            response = await client.achat(Chat(
                messages=[
                    Messages(role=MessagesRole.SYSTEM, content=system),
                    Messages(role=MessagesRole.USER, content=user),
                ],
                temperature=0.2,
            ))
    except AuthenticationError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="llm_auth_failed")
    except Exception:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="llm_unavailable")
    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


@router.post("/extract-event", response_model=ExtractEventResponse)
async def extract_event(body: ExtractEventRequest) -> ExtractEventResponse:
    system = _inject_date(EXTRACT_EVENT_SYSTEM_PROMPT)
    data = await _chat(system, body.text)
    try:
        end_at = _apply_default_duration(data.get("start_at"), data.get("end_at"))
        return ExtractEventResponse(
            title=data.get("title"),
            start_at=data.get("start_at"),
            end_at=end_at,
            location=data.get("location"),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/extract-deadline", response_model=ExtractDeadlineResponse)
async def extract_deadline(body: ExtractEventRequest) -> ExtractDeadlineResponse:
    system = _inject_date(EXTRACT_DEADLINE_SYSTEM_PROMPT)
    data = await _chat(system, body.text)
    try:
        return ExtractDeadlineResponse(
            title=data.get("title"),
            due_at=data.get("due_at"),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/compose-message", response_model=ComposeMessageResponse)
async def compose_message(body: ComposeMessageRequest) -> ComposeMessageResponse:
    system = _inject_date(COMPOSE_MESSAGE_SYSTEM_PROMPT)
    author_context = ""
    if body.author_groups:
        groups_str = ", ".join(body.author_groups)
        author_context = f"Группы автора сообщения: {groups_str}\n"
    user_prompt = f"{author_context}Описание задачи: {body.description}"
    data = await _chat(system, user_prompt)
    try:
        employees = [EmployeeRef(**e) for e in data.get("employees", [])]
        return ComposeMessageResponse(
            subject=data["subject"],
            body=data["body"],
            users=data.get("users", []),
            groups=data.get("groups", []),
            employees=employees,
            warnings=data.get("warnings", []),
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/summarize-inbox", response_model=SummarizeInboxResponse)
async def summarize_inbox(body: SummarizeInboxRequest) -> SummarizeInboxResponse:
    def _format_message(m) -> str:
        tags = []
        if m.category:
            tags.append(m.category)
        if m.requires_response:
            tags.append("требует ответа")
        tag_str = f" ({', '.join(tags)})" if tags else ""
        read_str = "Не прочитано" if not m.is_read else "Прочитано"
        return f"[{read_str}{tag_str}] {m.created_at} от {m.sender_name}:\n{m.body}"

    messages_text = "\n\n".join(_format_message(m) for m in body.messages)
    data = await _chat(SUMMARIZE_INBOX_SYSTEM_PROMPT, messages_text)
    try:
        return SummarizeInboxResponse(**data)
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/categorize-message", response_model=CategorizeMessageResponse)
async def categorize_message(body: CategorizeMessageRequest) -> CategorizeMessageResponse:
    user_prompt = f"Тема: {body.subject}\n\nТекст: {body.body}"
    data = await _chat(CATEGORIZE_MESSAGE_SYSTEM_PROMPT, user_prompt)
    try:
        return CategorizeMessageResponse(
            category=data["category"],
            requires_response=data["requires_response"],
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/calendar-plan", response_model=CalendarPlanResponse)
async def calendar_plan(body: CalendarPlanRequest) -> CalendarPlanResponse:
    system = _inject_date(CALENDAR_PLAN_SYSTEM_PROMPT)
    data = await _chat(system, body.question)
    try:
        return CalendarPlanResponse(
            need_events=data["need_events"],
            need_deadlines=data["need_deadlines"],
            date_from=data["date_from"],
            date_to=data["date_to"],
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/calendar-answer", response_model=CalendarAnswerResponse)
async def calendar_answer(body: CalendarAnswerRequest) -> CalendarAnswerResponse:
    system = _inject_date(CALENDAR_ANSWER_SYSTEM_PROMPT)
    events_text = ""
    if body.events:
        lines = []
        for e in body.events:
            time_info = e.start_at
            if e.end_at:
                time_info += f" – {e.end_at}"
            loc = f", {e.location}" if e.location else ""
            lines.append(f"  • {e.title} ({time_info}{loc})")
        events_text = "Мероприятия:\n" + "\n".join(lines)
    deadlines_text = ""
    if body.deadlines:
        lines = [f"  • {d.title} (срок: {d.due_at})" for d in body.deadlines]
        deadlines_text = "Дедлайны:\n" + "\n".join(lines)
    calendar_data = "\n\n".join(filter(None, [events_text, deadlines_text])) or "Данных нет."
    user_prompt = f"Вопрос: {body.question}\n\n{calendar_data}"
    data = await _chat(system, user_prompt)
    try:
        return CalendarAnswerResponse(answer=data["answer"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/check-toxicity", response_model=LlmToxicityResponse)
async def check_toxicity_llm(body: LlmToxicityRequest) -> LlmToxicityResponse:
    user_prompt = f"Оценка ML-модели: {body.score:.4f}\n\nТекст сообщения:\n{body.text}"
    data = await _chat(CHECK_TOXICITY_SYSTEM_PROMPT, user_prompt)
    try:
        return LlmToxicityResponse(toxic=data["toxic"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")


@router.post("/rephrase", response_model=RephraseResponse)
async def rephrase(body: RephraseRequest) -> RephraseResponse:
    data = await _chat(REPHRASE_SYSTEM_PROMPT, body.text)
    try:
        return RephraseResponse(text=data["text"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="llm_schema_mismatch")