import hashlib
import hmac
import os

from app.core.security import get_jwt_settings

COOKIE_NAME = "logos_session"


def cookie_secure() -> bool:
    return os.getenv("COOKIE_SECURE", "true").lower() == "true"


def create_csrf_token(access_token: str) -> str:
    secret_key, _ = get_jwt_settings()

    return hmac.new(
        secret_key.encode(),
        f"csrf:{access_token}".encode(),
        hashlib.sha256,
    ).hexdigest()


def valid_csrf_token(
    access_token: str,
    submitted_token: str | None,
) -> bool:
    if not submitted_token:
        return False

    expected = create_csrf_token(access_token)
    return hmac.compare_digest(expected, submitted_token)
