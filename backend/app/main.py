from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.incidents import router as incidents_router

app = FastAPI(
    title="Logos API",
    description="API de gerenciamento de incidentes logísticos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(incidents_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Logos API funcionando!"}
