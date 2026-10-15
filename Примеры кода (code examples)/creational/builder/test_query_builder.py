import pytest
from query_builder import QueryBuilder


def test_fluent_query_with_params() -> None:
    q = (
        QueryBuilder()
        .select("name", "age")
        .from_table("users")
        .where("age > ?", 18)
        .order_by("name")
        .limit(10)
        .build()
    )
    assert q.sql == (
        "SELECT name, age FROM users WHERE age > ? ORDER BY name LIMIT 10"
    )
    assert q.params == (18,)


def test_build_requires_from() -> None:
    with pytest.raises(ValueError, match="FROM"):
        QueryBuilder().select("id").build()


def test_negative_limit() -> None:
    with pytest.raises(ValueError, match="limit"):
        QueryBuilder().select("id").from_table("t").limit(-1)
