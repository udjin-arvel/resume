from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Self


@dataclass(frozen=True)
class SqlQuery:
    sql: str
    params: tuple[Any, ...]


class QueryBuilder:
    def __init__(self) -> None:
        self._select: list[str] = []
        self._from: str | None = None
        self._joins: list[str] = []
        self._where_parts: list[str] = []
        self._params: list[Any] = []
        self._order_by: list[str] = []
        self._limit: int | None = None
        self._offset: int | None = None

    def select(self, *fields: str) -> Self:
        if not fields:
            raise ValueError("select() requires at least one field")
        self._select.extend(fields)
        return self

    def from_table(self, table: str) -> Self:
        if not table.strip():
            raise ValueError("table name cannot be empty")
        self._from = table
        return self

    def join(self, clause: str) -> Self:
        self._joins.append(clause)
        return self

    def where(self, condition: str, *params: Any) -> Self:
        self._where_parts.append(condition)
        self._params.extend(params)
        return self

    def order_by(self, *columns: str) -> Self:
        self._order_by.extend(columns)
        return self

    def limit(self, n: int) -> Self:
        if n < 0:
            raise ValueError("limit must be non-negative")
        self._limit = n
        return self

    def offset(self, n: int) -> Self:
        if n < 0:
            raise ValueError("offset must be non-negative")
        self._offset = n
        return self

    def build(self) -> SqlQuery:
        if not self._select:
            raise ValueError("SELECT clause is required")
        if self._from is None:
            raise ValueError("FROM clause is required")

        sql_parts = [f"SELECT {', '.join(self._select)}", f"FROM {self._from}"]
        if self._joins:
            sql_parts.extend(self._joins)
        if self._where_parts:
            sql_parts.append("WHERE " + " AND ".join(self._where_parts))
        if self._order_by:
            sql_parts.append("ORDER BY " + ", ".join(self._order_by))
        if self._limit is not None:
            sql_parts.append(f"LIMIT {self._limit}")
        if self._offset is not None:
            sql_parts.append(f"OFFSET {self._offset}")

        return SqlQuery(sql=" ".join(sql_parts), params=tuple(self._params))
