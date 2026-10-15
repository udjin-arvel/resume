from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol


class InvalidEmailError(ValueError):
    pass


class UserAlreadyExistsError(Exception):
    pass


@dataclass(frozen=True)
class User:
    id: str
    email: str
    password_hash: str


class PasswordHasher(Protocol):
    def hash(self, plain_password: str) -> str: ...


class WelcomeNotifier(Protocol):
    def send_welcome(self, email: str) -> None: ...


class AbstractUserRepository(ABC):
    @abstractmethod
    def exists_by_email(self, email: str) -> bool: ...

    @abstractmethod
    def save(self, user: User) -> None: ...

    @abstractmethod
    def get_by_email(self, email: str) -> User | None: ...


def normalize_email(email: str) -> str:
    value = email.strip().lower()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise InvalidEmailError("invalid email")
    return value
