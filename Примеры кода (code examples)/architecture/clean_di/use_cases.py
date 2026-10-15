from __future__ import annotations

import uuid
from dataclasses import dataclass

from domain import (
    AbstractUserRepository,
    PasswordHasher,
    User,
    UserAlreadyExistsError,
    WelcomeNotifier,
    normalize_email,
)


@dataclass
class RegisterUserCommand:
    email: str
    password: str


@dataclass(frozen=True)
class RegisterUserResult:
    user_id: str
    email: str


class RegisterUserUseCase:
    def __init__(
        self,
        repository: AbstractUserRepository,
        password_hasher: PasswordHasher,
        welcome_notifier: WelcomeNotifier,
    ) -> None:
        self._repository = repository
        self._password_hasher = password_hasher
        self._welcome_notifier = welcome_notifier

    def execute(self, command: RegisterUserCommand) -> RegisterUserResult:
        email = normalize_email(command.email)
        if self._repository.exists_by_email(email):
            raise UserAlreadyExistsError(email)
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=self._password_hasher.hash(command.password),
        )
        self._repository.save(user)
        self._welcome_notifier.send_welcome(user.email)
        return RegisterUserResult(user_id=user.id, email=user.email)
