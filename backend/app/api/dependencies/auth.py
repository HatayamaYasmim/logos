from fastapi import (
    Cookie,
    Depends,
    Header,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.cookies import (
    COOKIE_NAME,
    valid_csrf_token,
)
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository


def get_session_token(
    logos_session: str | None = Cookie(
        default=None,
        alias=COOKIE_NAME,
    ),
) -> str:
    if not logos_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão não autenticada.",
        )

    return logos_session


def get_current_user(
    token: str = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
        )

    repository = UserRepository(db)
    user = repository.find_by_id(user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo ou não encontrado.",
        )

    return user


def verify_csrf(
    token: str = Depends(get_session_token),
    csrf_token: str | None = Header(
        default=None,
        alias="X-CSRF-Token",
    ),
) -> None:
    if not valid_csrf_token(token, csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF inválido ou ausente.",
        )
