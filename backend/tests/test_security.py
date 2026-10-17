from datetime import datetime, timedelta, timezone

import jwt

from app.core.cookies import create_csrf_token, valid_csrf_token
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

TEST_SECRET = "chave-de-teste-exclusiva-com-32-caracteres"


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
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    token = create_access_token(user_id=1)

    assert isinstance(token, str)
    assert decode_access_token(token) == 1


def test_reject_invalid_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    assert decode_access_token("token-invalido") is None


def test_reject_expired_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    expired_token = jwt.encode(
        {
            "sub": "1",
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        },
        TEST_SECRET,
        algorithm="HS256",
    )

    assert decode_access_token(expired_token) is None


def test_create_and_validate_csrf_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    access_token = create_access_token(user_id=1)
    csrf_token = create_csrf_token(access_token)

    assert isinstance(csrf_token, str)
    assert len(csrf_token) == 64
    assert valid_csrf_token(access_token, csrf_token)


def test_reject_missing_csrf_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    access_token = create_access_token(user_id=1)

    assert not valid_csrf_token(access_token, None)
    assert not valid_csrf_token(access_token, "")


def test_reject_invalid_csrf_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    access_token = create_access_token(user_id=1)

    assert not valid_csrf_token(
        access_token,
        "token-csrf-invalido",
    )


def test_reject_csrf_from_another_session(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)

    token_a = create_access_token(user_id=1)
    token_b = create_access_token(user_id=2)

    csrf_a = create_csrf_token(token_a)

    assert valid_csrf_token(token_a, csrf_a)
    assert not valid_csrf_token(token_b, csrf_a)
