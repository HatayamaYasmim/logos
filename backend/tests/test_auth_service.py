from unittest.mock import Mock

from app.core.security import hash_password
from app.services.auth_service import AuthService


def test_authenticate_valid_credentials():
    repository = Mock()

    user = Mock()
    user.email = "analista@logos.com"
    user.is_active = True
    user.password_hash = hash_password("SenhaSegura123!")

    repository.find_by_email.return_value = user

    service = AuthService(repository)

    result = service.authenticate(
        "ANALISTA@LOGOS.COM",
        "SenhaSegura123!",
    )

    assert result is user
    repository.find_by_email.assert_called_once_with("analista@logos.com")


def test_authenticate_wrong_password():
    repository = Mock()

    user = Mock()
    user.is_active = True
    user.password_hash = hash_password("SenhaCorreta123!")

    repository.find_by_email.return_value = user

    service = AuthService(repository)

    result = service.authenticate(
        "analista@logos.com",
        "SenhaErrada123!",
    )

    assert result is None


def test_authenticate_nonexistent_user():
    repository = Mock()
    repository.find_by_email.return_value = None

    service = AuthService(repository)

    result = service.authenticate(
        "inexistente@logos.com",
        "QualquerSenha123!",
    )

    assert result is None


def test_authenticate_inactive_user():
    repository = Mock()

    user = Mock()
    user.is_active = False
    user.password_hash = hash_password("SenhaSegura123!")

    repository.find_by_email.return_value = user

    service = AuthService(repository)

    result = service.authenticate(
        "analista@logos.com",
        "SenhaSegura123!",
    )

    assert result is None
