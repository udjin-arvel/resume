from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from domain import AbstractUserRepository, PasswordHasher, WelcomeNotifier
from infrastructure import (
    ConsoleWelcomeNotifier,
    InMemoryDatabase,
    InMemoryUserRepository,
    PostgresUserRepository,
    Sha256PasswordHasher,
)
from use_cases import RegisterUserCommand, RegisterUserResult, RegisterUserUseCase

from fastapi import Body, Depends, FastAPI, HTTPException
from pydantic import BaseModel


# Тип запроса регистрации (Pydantic модель)
class RegisterRequest(BaseModel):
    email: str
    password: str


# Тип контейнера
@dataclass
class Container:
    user_repository: AbstractUserRepository
    password_hasher: PasswordHasher
    welcome_notifier: WelcomeNotifier

    def register_user_use_case(self) -> RegisterUserUseCase:
        return RegisterUserUseCase(
            repository=self.user_repository,
            password_hasher=self.password_hasher,
            welcome_notifier=self.welcome_notifier,
        )


# Метод для создания контейнера (composition root, абстракции склеиваются с реализациями)
def build_container(use_memory: bool = True) -> Container:
    if use_memory:
        repo: AbstractUserRepository = InMemoryUserRepository()
    else:
        repo = PostgresUserRepository(InMemoryDatabase())
    return Container(
        user_repository=repo,
        password_hasher=Sha256PasswordHasher(),
        welcome_notifier=ConsoleWelcomeNotifier(),
    )


# Создаем FastAPI приложение
def create_app(container: Container | None = None) -> FastAPI:
    app = FastAPI(title="Регистрация пользователей")
    _container = container or build_container()

    def get_container() -> Container:
        return _container

    # Получаем зависимость для регистрации пользователя с ленивой подгрузкой контейнера (через замыкание берем контейнер из внешнего контекста)
    def get_register_use_case(
        c: Container = Depends(get_container),
    ) -> RegisterUserUseCase:
        return c.register_user_use_case()

    # Создаем маршрут для регистрации пользователя
    @app.post("/register", response_model=RegisterUserResult)
    def register(
        payload: Annotated[RegisterRequest, Body()],
        use_case: RegisterUserUseCase = Depends(get_register_use_case),
    ) -> RegisterUserResult:
        from domain import InvalidEmailError, UserAlreadyExistsError

        try:
            return use_case.execute(
                RegisterUserCommand(email=payload.email, password=payload.password)
            )
        except InvalidEmailError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except UserAlreadyExistsError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc

    return app
