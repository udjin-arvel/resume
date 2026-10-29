import { Fragment, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { formatApiError } from '../../api/client'
import type { ModerationApproveOverrides, ModerationQueueItem } from './api'
import {
  approveModerationItem,
  listModerationQueue,
  listSubstanceAuditHistory,
  rejectModerationItem,
  rollbackSubstance,
} from './api'

type StatusFilter = '' | 'pending' | 'approved' | 'rejected'

function candidateName(item: ModerationQueueItem): string {
  const name = item.candidate?.name
  return typeof name === 'string' ? name : '—'
}

export function ModerationQueuePage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<ModerationQueueItem | null>(null)
  const [historyFor, setHistoryFor] = useState<string | null>(null)

  const queueQuery = useQuery({
    queryKey: ['moderation-queue', status],
    queryFn: () =>
      listModerationQueue({
        status: status || undefined,
        limit: 80,
        suggestions: status === 'pending',
      }),
  })

  const historyQuery = useQuery({
    queryKey: ['substance-audit', historyFor],
    queryFn: () => listSubstanceAuditHistory(historyFor!, 40),
    enabled: Boolean(historyFor),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })

  const approveMutation = useMutation({
    mutationFn: ({ id, overrides }: { id: string; overrides?: ModerationApproveOverrides }) =>
      approveModerationItem(id, overrides),
    onSuccess: () => {
      setEditItem(null)
      void invalidate()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectModerationItem(id, reason),
    onSuccess: () => void invalidate(),
  })

  const rollbackMutation = useMutation({
    mutationFn: ({ substanceId, auditId }: { substanceId: string; auditId: string }) =>
      rollbackSubstance(substanceId, auditId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['substance-audit', historyFor] })
      void invalidate()
    },
  })

  const errorMessage = useMemo(
    () => (queueQuery.error ? formatApiError(queueQuery.error) : ''),
    [queueQuery.error],
  )

  const counts = queueQuery.data?.counts

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="moderation-segmented" role="tablist" aria-label="Статус очереди">
          {(['pending', 'approved', 'rejected', ''] as const).map((value) => (
            <button
              key={value || 'all'}
              type="button"
              className={
                status === value ? 'moderation-segment-active secondary-button' : 'secondary-button'
              }
              style={{ padding: '8px 12px', fontSize: 13 }}
              onClick={() => setStatus(value)}
            >
              {value === ''
                ? 'Все'
                : value === 'pending'
                  ? `Ожидают (${counts?.pending ?? '…'})`
                  : value === 'approved'
                    ? `Утверждённые (${counts?.approved ?? '…'})`
                    : `Отклонённые (${counts?.rejected ?? '…'})`}
            </button>
          ))}
        </div>
      </div>

      {queueQuery.isLoading ? <p className="muted">Загрузка очереди…</p> : null}
      {errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th />
              <th>Штрих-код</th>
              <th>Кандидат</th>
              <th>Ключ</th>
              <th>Статус</th>
              <th>Создан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {queueQuery.data?.items.map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      onClick={() => setExpanded((cur) => (cur === item.id ? null : item.id))}
                      aria-expanded={expanded === item.id}
                    >
                      {expanded === item.id ? '−' : '+'}
                    </button>
                  </td>
                  <td className="mono">{item.barcode}</td>
                  <td>{candidateName(item)}</td>
                  <td className="mono muted">{item.normalizedKey || '—'}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="row-actions">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="primary-button"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate({ id: item.id })}
                        >
                          Утвердить
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          onClick={() => setEditItem(item)}
                        >
                          Правка
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '8px 12px', fontSize: 13 }}
                          onClick={() => {
                            const reason = window.prompt('Причина отклонения (необязательно)') ?? ''
                            rejectMutation.mutate({ id: item.id, reason })
                          }}
                        >
                          Отклонить
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
                {expanded === item.id ? (
                  <tr className="detail-row">
                    <td colSpan={7}>
                      <div className="moderation-detail-grid">
                        <div>
                          <h4 className="moderation-detail-heading">Кандидат (JSON)</h4>
                          <pre className="moderation-code">{JSON.stringify(item.candidate, null, 2)}</pre>
                        </div>
                        <div>
                          <h4 className="moderation-detail-heading">Подсказка слияния</h4>
                          {item.mergeSuggestion ? (
                            <>
                              <pre className="moderation-code">
                                {JSON.stringify(item.mergeSuggestion, null, 2)}
                              </pre>
                              <button
                                type="button"
                                className="secondary-button"
                                style={{ marginTop: 8 }}
                                onClick={() =>
                                  setHistoryFor((cur) =>
                                    cur === item.mergeSuggestion!.id ? null : item.mergeSuggestion!.id,
                                  )
                                }
                              >
                                История версий / откат
                              </button>
                              {historyFor === item.mergeSuggestion?.id ? (
                                <div className="moderation-audit-panel">
                                  {historyQuery.isLoading ? (
                                    <p className="muted">Загрузка аудита…</p>
                                  ) : (
                                    <ul className="moderation-audit-list">
                                      {historyQuery.data?.items.map((row) => (
                                        <li key={row.id}>
                                          <span className="mono">{row.action}</span>
                                          <span className="muted">
                                            {' '}
                                            — {new Date(row.createdAt).toLocaleString()}
                                          </span>
                                          <button
                                            type="button"
                                            className="secondary-button"
                                            style={{ marginLeft: 8, padding: '4px 8px', fontSize: 12 }}
                                            disabled={rollbackMutation.isPending}
                                            onClick={() =>
                                              rollbackMutation.mutate({
                                                substanceId: item.mergeSuggestion!.id,
                                                auditId: row.id,
                                              })
                                            }
                                          >
                                            Откатить к снимку
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <p className="muted">Нет совпадения по справочнику.</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {editItem ? (
        <ApproveEditDialog
          item={editItem}
          onClose={() => setEditItem(null)}
          onSubmit={(overrides) => approveMutation.mutate({ id: editItem.id, overrides })}
          busy={approveMutation.isPending}
        />
      ) : null}
    </div>
  )
}

type ApproveEditDialogProps = {
  item: ModerationQueueItem
  onClose: () => void
  onSubmit: (o: ModerationApproveOverrides) => void
  busy: boolean
}

function ApproveEditDialog({ item, onClose, onSubmit, busy }: ApproveEditDialogProps) {
  const c = item.candidate
  const [code, setCode] = useState(typeof c.code === 'string' ? c.code : '')
  const [name, setName] = useState(typeof c.name === 'string' ? c.name : '')
  const [category, setCategory] = useState('other')
  const [dangerLevel, setDangerLevel] = useState<'safe' | 'controversial' | 'dangerous'>(
    typeof c.suggestedDangerLevel === 'string' &&
      ['safe', 'controversial', 'dangerous'].includes(String(c.suggestedDangerLevel))
      ? (c.suggestedDangerLevel as 'safe' | 'controversial' | 'dangerous')
      : 'controversial',
  )
  const [description, setDescription] = useState(
    typeof c.rationale === 'string' ? c.rationale : '',
  )

  return (
        <div className="moderation-modal-backdrop" role="presentation" onClick={onClose}>
          <div
            className="moderation-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="moderation-edit-title">Правка перед утверждением</h3>
            <label className="moderation-field">
              <span>Код</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <label className="moderation-field">
              <span>Название</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="moderation-field">
              <span>Категория</span>
              <input value={category} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label className="moderation-field">
              <span>Опасность</span>
              <select
                value={dangerLevel}
                onChange={(event) =>
                  setDangerLevel(event.target.value as 'safe' | 'controversial' | 'dangerous')
                }
              >
                <option value="safe">safe</option>
                <option value="controversial">controversial</option>
                <option value="dangerous">dangerous</option>
              </select>
            </label>
            <label className="moderation-field">
              <span>Описание</span>
              <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <div className="moderation-modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Отмена
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={busy || !name.trim()}
                onClick={() =>
                  onSubmit({
                    code,
                    name: name.trim(),
                    category: category.trim() || 'other',
                    dangerLevel,
                    description,
                  })
                }
              >
                Утвердить
              </button>
            </div>
          </div>
        </div>
  )
}
