from getpass import getpass

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.session import DATABASE_URL
from app.models.user import User


def main():
    print("=== Logos | Criar analista ===")

    name = input("Nome: ").strip()
    email = input("E-mail: ").strip().lower()
    password = getpass("Senha: ")

    if not name or not email or "@" not in email:
        print("Nome ou e-mail inválido.")
        return

    if len(password) < 12:
        print("A senha deve ter pelo menos 12 caracteres.")
        return

    engine = create_engine(DATABASE_URL)

    with Session(engine) as db:
        existing_user = db.scalar(select(User).where(User.email == email))

        if existing_user is not None:
            print("Já existe um usuário com esse e-mail.")
            return

        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"Analista criado com sucesso! ID: {user.id}")


if __name__ == "__main__":
    main()
