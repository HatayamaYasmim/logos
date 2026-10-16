from app.core.security import verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def authenticate(
        self,
        email: str,
        password: str,
    ) -> User | None:
        normalized_email = email.strip().lower()

        user = self.user_repository.find_by_email(normalized_email)

        if user is None:
            return None

        if not user.is_active:
            return None

        if not verify_password(
            password,
            user.password_hash,
        ):
            return None

        return user
