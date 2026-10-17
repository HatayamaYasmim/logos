from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies.auth import (
    get_current_user,
    get_session_token,
    verify_csrf,
)
from app.core.cookies import (
    COOKIE_NAME,
    cookie_secure,
    create_csrf_token,
)
from app.core.security import (
    create_access_token,
    get_jwt_settings,
)
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)


@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    repository = UserRepository(db)
    service = AuthService(repository)

    user = service.authenticate(
        email=form_data.username,
        password=form_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )

    token = create_access_token(user.id)
    _, expires_minutes = get_jwt_settings()

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=expires_minutes * 60,
        httponly=True,
        secure=cookie_secure(),
        samesite="lax",
        path="/",
    )

    return {
        "email": user.email,
        "csrf_token": create_csrf_token(token),
    }


@router.get("/me")
def me(
    current_user: User = Depends(get_current_user),
    token: str = Depends(get_session_token),
):
    return {
        "email": current_user.email,
        "csrf_token": create_csrf_token(token),
    }


@router.post("/logout", dependencies=[Depends(verify_csrf)])
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=cookie_secure(),
        httponly=True,
        samesite="lax",
    )

    return {"message": "Sessão encerrada."}
