from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, verify_csrf
from app.core.ai_config import get_ai_settings
from app.database.session import get_db
from app.schemas.ai import AIChatRequest, AIResponse
from app.services.ai.agent_service import AgentService
from app.services.ai.openrouter_client import OpenRouterError

router = APIRouter(
    prefix="/ai",
    tags=["Logos AI"],
    dependencies=[
        Depends(get_current_user),
        Depends(verify_csrf),
    ],
)


def get_agent_service(
    db: Session = Depends(get_db),
) -> AgentService:
    return AgentService(db)


def validate_ai_configuration() -> None:
    try:
        get_ai_settings()
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail="O Logos AI não está configurado ou disponível.",
        ) from exc


def handle_ai_error(exc: OpenRouterError) -> None:
    raise HTTPException(
        status_code=exc.status_code,
        detail=str(exc),
    ) from exc


@router.post("/chat", response_model=AIResponse)
def chat_with_ai(
    data: AIChatRequest,
    agent: AgentService = Depends(get_agent_service),
):
    validate_ai_configuration()

    try:
        answer = agent.chat(data.question)
        return AIResponse(answer=answer)

    except OpenRouterError as exc:
        handle_ai_error(exc)


@router.post(
    "/incidents/{incident_id}/analyze",
    response_model=AIResponse,
)
def analyze_incident(
    incident_id: int,
    agent: AgentService = Depends(get_agent_service),
):
    if incident_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="ID de incidente inválido.",
        )

    validate_ai_configuration()

    try:
        answer = agent.analyze_incident(incident_id)
        return AIResponse(answer=answer)

    except OpenRouterError as exc:
        handle_ai_error(exc)
