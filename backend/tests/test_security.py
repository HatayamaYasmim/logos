import jwt

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password():
    password = "SenhaSegura123!"

    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2")
    assert verify_password(password, hashed)


def test_reject_invalid_password():
    hashed = hash_password("SenhaCorreta123!")

    assert not verify_password(
        "SenhaIncorreta123!",
        hashed,
    )


def test_hashes_are_different():
    password = "SenhaSegura123!"

    first_hash = hash_password(password)
    second_hash = hash_password(password)

    assert first_hash != second_hash


def test_create_and_decode_token(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "chave-de-teste-exclusiva-com-32-caracteres",
    )
    token = create_access_token(user_id=1)

    assert isinstance(token, str)
    assert decode_access_token(token) == 1


def test_reject_invalid_token(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "chave-de-teste-exclusiva-com-32-caracteres",
    )

    assert decode_access_token("token-invalido") is None


def test_reject_expired_token(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "chave-de-teste-exclusiva-com-32-caracteres",
    )

    from datetime import datetime, timedelta, timezone

    expired_token = jwt.encode(
        {
            "sub": "1",
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        },
        "chave-de-teste-exclusiva-com-32-caracteres",
        algorithm="HS256",
    )

    assert decode_access_token(expired_token) is None
