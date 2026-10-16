import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

load_dotenv()

password_hash = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"


def get_jwt_settings() -> tuple[str, int]:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY não configurada no ambiente.")

    expires_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    if expires_minutes <= 0:
        raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES deve ser positivo.")

    return secret_key, expires_minutes


def hash_password(password: str) -> str:
    """Gera um hash Argon2 para a senha."""
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Verifica se a senha corresponde ao hash."""
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(user_id: int) -> str:
    """Cria um JWT de acesso para o usuário."""
    secret_key, expires_minutes = get_jwt_settings()

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> int | None:
    """
    Valida o JWT e retorna o ID do usuário.

    Retorna None para tokens inválidos ou expirados.
    """
    secret_key, _ = get_jwt_settings()

    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]},
        )

        user_id = int(payload["sub"])

        if user_id <= 0:
            return None

        return user_id

    except (InvalidTokenError, ValueError, TypeError):
        return None
