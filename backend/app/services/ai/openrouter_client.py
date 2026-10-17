import logging
from typing import Any

import httpx

from app.core.ai_config import get_ai_settings

logger = logging.getLogger("uvicorn.error")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 502,
    ):
        super().__init__(message)
        self.status_code = status_code


class OpenRouterClient:
    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        settings = get_ai_settings()

        payload: dict[str, Any] = {
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 2500,
        }

        if settings.fallback_models:
            payload["models"] = [
                settings.model,
                *settings.fallback_models,
            ]
        else:
            payload["model"] = settings.model

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        logger.info(
            "Logos AI: modelos enviados=%s",
            payload.get("models", [payload.get("model")]),
        )

        try:
            with httpx.Client(timeout=settings.timeout) as client:
                response = client.post(
                    OPENROUTER_URL,
                    headers={
                        "Authorization": f"Bearer {settings.api_key}",
                        "Content-Type": "application/json",
                        "X-Title": "Logos AI",
                    },
                    json=payload,
                )

            if response.status_code == 429:
                provider_name = "desconhecido"
                limit_source = "desconhecido"

                try:
                    data = response.json()
                    error = data.get("error", {})
                    metadata = error.get("metadata") or {}

                    provider_name = metadata.get(
                        "provider_name",
                        provider_name,
                    )
                    limit_source = metadata.get(
                        "limit_source",
                        limit_source,
                    )
                except (ValueError, AttributeError, TypeError):
                    pass

                logger.warning(
                    "OpenRouter 429: provider=%s, limit_source=%s, retry_after=%s",
                    provider_name,
                    limit_source,
                    response.headers.get("Retry-After"),
                )

                raise OpenRouterError(
                    "O provedor de IA está temporariamente "
                    "limitado. Tente novamente mais tarde.",
                    status_code=429,
                )

            if response.status_code in (401, 403):
                logger.error(
                    "OpenRouter: falha de autenticação HTTP %s",
                    response.status_code,
                )

                raise OpenRouterError(
                    "Falha na autenticação com o serviço de IA.",
                    status_code=502,
                )

            response.raise_for_status()

            try:
                data = response.json()
            except ValueError as exc:
                raise OpenRouterError(
                    "O serviço de IA retornou JSON inválido."
                ) from exc

            if not isinstance(data, dict):
                raise OpenRouterError("O serviço de IA retornou dados inválidos.")

            choices = data.get("choices")

            if not isinstance(choices, list) or not choices:
                logger.error(
                    "OpenRouter: resposta sem choices. Modelo=%s",
                    data.get("model"),
                )

                raise OpenRouterError("O serviço de IA não retornou respostas.")

            choice = choices[0]

            if not isinstance(choice, dict):
                raise OpenRouterError("O serviço de IA retornou uma resposta inválida.")

            finish_reason = choice.get("finish_reason")
            message = choice.get("message")

            logger.info(
                "OpenRouter: modelo=%s, finish_reason=%s",
                data.get("model"),
                finish_reason,
            )

            if finish_reason == "length":
                raise OpenRouterError(
                    "A IA atingiu o limite de geração antes de concluir a resposta."
                )

            if not isinstance(message, dict):
                logger.error(
                    "OpenRouter: message inválida. Tipo=%s, modelo=%s",
                    type(message).__name__,
                    data.get("model"),
                )

                raise OpenRouterError("O modelo não retornou uma mensagem válida.")

            content = message.get("content")
            tool_calls = message.get("tool_calls")

            has_content = isinstance(content, str) and bool(content.strip())

            has_tool_calls = isinstance(tool_calls, list) and len(tool_calls) > 0

            if not has_content and not has_tool_calls:
                logger.error(
                    "OpenRouter: resposta vazia. Modelo=%s, finish_reason=%s",
                    data.get("model"),
                    finish_reason,
                )

                raise OpenRouterError("O modelo não produziu uma resposta utilizável.")

            return message

        except httpx.TimeoutException as exc:
            logger.warning(
                "OpenRouter: timeout após %s segundos",
                settings.timeout,
            )

            raise OpenRouterError(
                "O serviço de IA demorou para responder.",
                status_code=504,
            ) from exc

        except httpx.HTTPStatusError as exc:
            response = exc.response

            try:
                data = response.json()
                error = data.get("error", {}) if isinstance(data, dict) else {}

                if isinstance(error, dict):
                    error_message = error.get("message")
                    metadata = error.get("metadata") or {}
                else:
                    error_message = str(error)
                    metadata = {}

                # Não registrar o corpo inteiro da resposta
                # para evitar exposição desnecessária de dados.
                logger.error(
                    "OpenRouter HTTP %s: message=%s, metadata=%s",
                    response.status_code,
                    error_message,
                    metadata,
                )

            except ValueError:
                logger.error(
                    "OpenRouter HTTP %s: resposta não JSON",
                    response.status_code,
                )

            raise OpenRouterError(
                "O serviço de IA não conseguiu processar a solicitação.",
                status_code=502,
            ) from exc

        except httpx.RequestError as exc:
            logger.error(
                "OpenRouter: erro de conexão (%s)",
                type(exc).__name__,
            )

            raise OpenRouterError(
                "Não foi possível conectar ao serviço de IA.",
                status_code=503,
            ) from exc
