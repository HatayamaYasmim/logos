import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.incidents import router as incidents_router

load_dotenv()

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

app = FastAPI(
    title="Logos API",
    description="API de gerenciamento de incidentes logísticos",
    version="1.0.0",
)


@app.middleware("http")
async def validate_request_origin(request: Request, call_next):
    """
    Valida a origem das requisições que modificam dados.

    A validação de Origin complementa o token CSRF.
    """

    if request.method not in SAFE_METHODS:
        origin = request.headers.get("origin")

        # Navegadores modernos enviam Origin nas
        # requisições cross-origin.
        if origin is None or origin not in ALLOWED_ORIGINS:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Origem da requisição não autorizada.",
                },
            )

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

app.include_router(incidents_router)
app.include_router(auth_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "message": "Logos API funcionando!",
    }
