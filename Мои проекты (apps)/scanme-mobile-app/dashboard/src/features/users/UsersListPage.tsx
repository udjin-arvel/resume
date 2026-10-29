import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { formatApiError } from '../../api/client'
import { listAdminUsers, patchAdminUser } from './api'

export function UsersListPage() {
  const queryClient = useQueryClient()
  const [premium, setPremium] = useState<'all' | 'premium' | 'free'>('all')
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const cursor = cursorStack.length ? cursorStack[cursorStack.length - 1] : undefined

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', premium, cursor ?? ''],
    queryFn: () => listAdminUsers({ limit: 25, premium, cursor }),
  })

  const patchMutation = useMutation({
    mutationFn: async ({ id, until }: { id: string; until: string | null }) =>
      patchAdminUser(id, { isPremiumUntil: until }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const errorMessage = useMemo(() => {
    if (!usersQuery.error) {
      return ''
    }
    return formatApiError(usersQuery.error)
  }, [usersQuery.error])

  function grantYearPremium(userId: string) {
    const until = new Date()
    until.setFullYear(until.getFullYear() + 1)
    patchMutation.mutate({ id: userId, until: until.toISOString() })
  }

  function revokePremium(userId: string) {
    patchMutation.mutate({ id: userId, until: null })
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <label className="field-inline">
          <span>Статус</span>
          <select
            value={premium}
            onChange={(event) => {
              setPremium(event.target.value as typeof premium)
              setCursorStack([])
            }}
          >
            <option value="all">Все</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
        </label>
      </div>

      {usersQuery.isLoading ? <p className="muted">Загрузка…</p> : null}
      {errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Premium до</th>
              <th>Создан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usersQuery.data?.items.map((user) => (
              <tr key={user.id}>
                <td className="mono">{user.deviceId}</td>
                <td>{user.isPremiumUntil ?? '—'}</td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={patchMutation.isPending}
                    onClick={() => grantYearPremium(user.id)}
                  >
                    +1 год premium
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={patchMutation.isPending}
                    onClick={() => revokePremium(user.id)}
                  >
                    Снять
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button
          type="button"
          className="btn-secondary"
          disabled={cursorStack.length === 0 || usersQuery.isFetching}
          onClick={() => setCursorStack((stack) => stack.slice(0, -1))}
        >
          Назад
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!usersQuery.data?.nextCursor || usersQuery.isFetching}
          onClick={() => {
            const next = usersQuery.data?.nextCursor
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
