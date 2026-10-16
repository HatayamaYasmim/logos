
import os
from types import SimpleNamespace

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.api.dependencies.auth import get_current_user
from app.database.session import Base, get_db
from app.main import app
from app.models.incident import Incident
from app.models.user import User  # noqa: F401

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL não foi configurada.")

# Proteção para impedir o uso do banco principal.
database_name = make_url(TEST_DATABASE_URL).database

if database_name != "logos_test":
    raise RuntimeError(
        "Os testes devem utilizar exclusivamente logos_test."
    )


test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    expire_on_commit=False,
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    # Este banco é exclusivo para testes.
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture
def client(prepare_test_database):
    app.dependency_overrides[get_db] = override_get_db

    app.dependency_overrides[get_current_user] = (
        lambda: SimpleNamespace(
            id=1,
            name="Analista de Teste",
            email="teste@logos.local",
            is_active=True,
        )
    )

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(
            get_current_user,
            None,
        )
        app.dependency_overrides.pop(
            get_db,
            None,
        )


@pytest.fixture(autouse=True)
def clean_database(prepare_test_database):
    yield

    with TestingSessionLocal() as db:
        db.query(Incident).delete()
        db.query(User).delete()
        db.commit()


@pytest.fixture
def test_db(prepare_test_database):
    with TestingSessionLocal() as db:
        yield db
