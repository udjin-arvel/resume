import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { formatApiError } from '../../api/client'
import { listAdminAudit } from './api'

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const cursor = cursorStack.length ? cursorStack[cursorStack.length - 1] : undefined

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit', entityType, cursor ?? ''],
    queryFn: () =>
      listAdminAudit({
        limit: 40,
        entityType: entityType.trim() || undefined,
        cursor,
      }),
  })

  const errorMessage = useMemo(() => {
    if (!auditQuery.error) {
      return ''
    }
    return formatApiError(auditQuery.error)
  }, [auditQuery.error])

  return (
    <div className="stack">
      <div className="toolbar">
        <label className="field-inline">
          <span>Тип сущности</span>
          <input
            value={entityType}
            placeholder="substance"
            onChange={(event) => {
              setEntityType(event.target.value)
              setCursorStack([])
            }}
          />
        </label>
      </div>

      {auditQuery.isLoading ? <p className="muted">Загрузка журнала…</p> : null}
      {errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Админ</th>
              <th>Действие</th>
              <th>Сущность</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {auditQuery.data?.items.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{row.adminEmail ?? '—'}</td>
                <td>{row.action}</td>
                <td>{row.entityType ?? '—'}</td>
                <td className="mono">{row.entityId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button
          type="button"
          className="btn-secondary"
          disabled={cursorStack.length === 0 || auditQuery.isFetching}
          onClick={() => setCursorStack((stack) => stack.slice(0, -1))}
        >
          Назад
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!auditQuery.data?.nextCursor || auditQuery.isFetching}
          onClick={() => {
            const next = auditQuery.data?.nextCursor
            if (next) {
              setCursorStack((stack) => [...stack, next])
            }
          }}
        >
          Дальше
        </button>
      </div>
    </div>
  )
}
