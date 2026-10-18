from pydantic import BaseModel, ConfigDict, Field


class AIChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(
        min_length=1,
        max_length=1000,
    )


class AIResponse(BaseModel):
    answer: str
