from domain import UserAlreadyExistsError
from infrastructure import ConsoleWelcomeNotifier, InMemoryUserRepository
from use_cases import RegisterUserCommand, RegisterUserUseCase
from container_and_api import build_container, create_app

from fastapi.testclient import TestClient
from infrastructure import Sha256PasswordHasher


def test_use_case_with_in_memory_repo() -> None:
    welcome: list[str] = []
    use_case = RegisterUserUseCase(
        InMemoryUserRepository(),
        Sha256PasswordHasher(),
        ConsoleWelcomeNotifier(welcome),
    )
    result = use_case.execute(RegisterUserCommand("user@example.com", "secret"))
    assert result.email == "user@example.com"
    assert welcome == ["welcome:user@example.com"]


def test_duplicate_email() -> None:
    repo = InMemoryUserRepository()
    hasher = Sha256PasswordHasher()
    use_case = RegisterUserUseCase(repo, hasher, ConsoleWelcomeNotifier())
    use_case.execute(RegisterUserCommand("a@b.c", "x"))
    try:
        use_case.execute(RegisterUserCommand("a@b.c", "y"))
    except UserAlreadyExistsError:
        pass
    else:
        raise AssertionError("expected duplicate error")


def test_fastapi_register() -> None:
    app = create_app(build_container())
    client = TestClient(app)
    response = client.post(
        "/register",
        json={"email": "new@example.com", "password": "pass"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"
