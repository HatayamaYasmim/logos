import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class AISettings:
    api_key: str
    model: str
    timeout: float
    fallback_models: tuple[str, ...]


def get_ai_settings() -> AISettings:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    model = os.getenv("OPENROUTER_MODEL", "").strip()

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY não configurada.")

    if not model:
        raise ValueError("OPENROUTER_MODEL não configurado.")

    try:
        timeout = float(os.getenv("OPENROUTER_TIMEOUT", "60"))
    except ValueError as exc:
        raise ValueError("OPENROUTER_TIMEOUT deve ser um número válido.") from exc

    if not 0 < timeout <= 120:
        raise ValueError("OPENROUTER_TIMEOUT deve estar entre 0 e 120 segundos.")

    fallback_models = tuple(
        item.strip()
        for item in os.getenv(
            "OPENROUTER_FALLBACK_MODELS",
            "",
        ).split(",")
        if item.strip() and item.strip() != model
    )

    return AISettings(
        api_key=api_key,
        model=model,
        timeout=timeout,
        fallback_models=tuple(dict.fromkeys(fallback_models)),
    )
