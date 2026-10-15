from __future__ import annotations

import hashlib
from typing import Any, Protocol

from domain import AbstractUserRepository, User


class DatabaseSession(Protocol):
    def execute(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]: ...

    def commit(self) -> None: ...


class InMemoryDatabase:
    def __init__(self) -> None:
        self._users: list[dict[str, Any]] = []

    def execute(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]:
        if sql.startswith("SELECT") and "email" in sql:
            email = params[0]
            return [row for row in self._users if row["email"] == email]
        if sql.startswith("INSERT"):
            self._users.append(
                {"id": params[0], "email": params[1], "password_hash": params[2]}
            )
            return []
        return []

    def commit(self) -> None:
        pass


class PostgresUserRepository(AbstractUserRepository):
    def __init__(self, session: DatabaseSession) -> None:
        self._session = session

    def exists_by_email(self, email: str) -> bool:
        rows = self._session.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,),
        )
        return len(rows) > 0

    def save(self, user: User) -> None:
        self._session.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s)",
            (user.id, user.email, user.password_hash),
        )
        self._session.commit()

    def get_by_email(self, email: str) -> User | None:
        rows = self._session.execute(
            "SELECT id, email, password_hash FROM users WHERE email = %s",
            (email,),
        )
        if not rows:
            return None
        row = rows[0]
        return User(id=row["id"], email=row["email"], password_hash=row["password_hash"])


class InMemoryUserRepository(AbstractUserRepository):
    def __init__(self) -> None:
        self._by_email: dict[str, User] = {}

    def exists_by_email(self, email: str) -> bool:
        return email in self._by_email

    def save(self, user: User) -> None:
        self._by_email[user.email] = user

    def get_by_email(self, email: str) -> User | None:
        return self._by_email.get(email)


class Sha256PasswordHasher:
    def hash(self, plain_password: str) -> str:
        return hashlib.sha256(plain_password.encode("utf-8")).hexdigest()


class ConsoleWelcomeNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    def send_welcome(self, email: str) -> None:
        self._outbox.append(f"welcome:{email}")
