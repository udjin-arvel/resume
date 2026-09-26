import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createSubstance,
  deleteSubstance,
  exportSubstances,
  importSubstances,
  listAdminSubstances,
  type DangerLevel,
  type Substance,
  type SubstanceFilters,
  type SubstancePayload,
  updateSubstance,
} from './api'

const schema = z.object({
  code: z.string().trim(),
  name: z.string().trim().min(2, 'Название обязательно'),
  aliasesText: z.string(),
  category: z.string().trim().min(2, 'Категория обязательна'),
  dangerLevel: z.enum(['safe', 'controversial', 'dangerous']),
  description: z.string(),
  sourcesText: z.string(),
  isActive: z.boolean(),
})

type SubstanceFormValues = z.infer<typeof schema>

const dangerLabels: Record<DangerLevel, string> = {
  safe: 'Безопасно',
  controversial: 'Спорно',
  dangerous: 'Опасно',
}

const emptyValues: SubstanceFormValues = {
  code: '',
  name: '',
  aliasesText: '',
  category: 'other',
  dangerLevel: 'controversial',
  description: '',
  sourcesText: '',
  isActive: true,
}

export function SubstancesPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<SubstanceFilters>({})
  const [editing, setEditing] = useState<Substance | null>(null)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')

  const substancesQuery = useQuery({
    queryKey: ['admin-substances', filters],
    queryFn: () => listAdminSubstances(filters),
  })

  const form = useForm<SubstanceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-substances'] })

  const saveMutation = useMutation({
    mutationFn: (values: SubstanceFormValues) => {
      const payload = formValuesToPayload(values)
      return editing ? updateSubstance(editing.id, payload) : createSubstance(payload)
    },
    onSuccess: () => {
      setMessage(editing ? 'Вещество обновлено' : 'Вещество создано')
      setEditing(null)
      form.reset(emptyValues)
      void invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubstance,
    onSuccess: () => {
      setMessage('Вещество удалено')
      void invalidate()
    },
  })

  const importMutation = useMutation({
    mutationFn: importSubstances,
    onSuccess: (items) => {
      setMessage(`Импортировано: ${items.length}`)
      setImportText('')
      void invalidate()
    },
  })

  const items = substancesQuery.data?.items ?? []
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items])

  function handleEdit(item: Substance) {
    setEditing(item)
    form.reset({
      code: item.code ?? '',
      name: item.name,
      aliasesText: item.aliases.join(', '),
      category: item.category,
      dangerLevel: item.dangerLevel,
      description: item.description,
      sourcesText: item.sources.join('\n'),
      isActive: item.isActive,
    })
  }

  async function handleExport() {
    const exported = await exportSubstances()
    setImportText(JSON.stringify(exported.map(substanceToPayload), null, 2))
    setMessage('Экспорт подготовлен в поле JSON')
  }

  function handleImport() {
    const parsed = JSON.parse(importText) as SubstancePayload[]
    importMutation.mutate(parsed)
  }

  return (
    <div className="substances-page">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Справочник веществ</h2>
            <p>Поиск, фильтры, CRUD и JSON import/export для базы анализа состава.</p>
          </div>
          <button className="secondary-button" onClick={handleExport} type="button">
            Export JSON
          </button>
        </div>

        <div className="filters">
          <input
            aria-label="Поиск"
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Поиск по имени, коду, alias"
          />
          <select
            aria-label="Уровень риска"
            onChange={(event) => setFilters((current) => ({ ...current, dangerLevel: event.target.value }))}
          >
            <option value="">Любой риск</option>
            <option value="safe">Безопасно</option>
            <option value="controversial">Спорно</option>
            <option value="dangerous">Опасно</option>
          </select>
          <select
            aria-label="Категория"
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {message ? <div className="status status-ok">{message}</div> : null}
        {substancesQuery.isError || saveMutation.isError || deleteMutation.isError || importMutation.isError ? (
          <div className="form-error">Операция не выполнена. Проверьте API и права администратора.</div>
        ) : null}

        <div className="substances-grid">
          <div className="substance-list">
            {substancesQuery.isLoading ? <p>Загрузка...</p> : null}
            {items.map((item) => (
              <article className="substance-card" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.code || 'без кода'} · v{item.version}</span>
                </div>
                <span className={`danger-badge danger-${item.dangerLevel}`}>{dangerLabels[item.dangerLevel]}</span>
                <p>{item.description || 'Описание не заполнено'}</p>
                <div className="card-actions">
                  <button className="secondary-button" onClick={() => handleEdit(item)} type="button">
                    Изменить
                  </button>
                  <button className="danger-button" onClick={() => deleteMutation.mutate(item.id)} type="button">
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <form className="substance-form" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <h3>{editing ? 'Редактировать вещество' : 'Новое вещество'}</h3>
            <input placeholder="Код, например E250" {...form.register('code')} />
            <label>
              Название
              <input {...form.register('name')} />
              {form.formState.errors.name ? <span className="field-error">{form.formState.errors.name.message}</span> : null}
            </label>
            <input placeholder="Категория" {...form.register('category')} />
            <select {...form.register('dangerLevel')}>
              <option value="safe">safe</option>
              <option value="controversial">controversial</option>
              <option value="dangerous">dangerous</option>
            </select>
            <textarea placeholder="Aliases через запятую" {...form.register('aliasesText')} />
            <textarea placeholder="Описание" rows={5} {...form.register('description')} />
            <textarea placeholder="Источники, по одному на строку" {...form.register('sourcesText')} />
            <label className="checkbox-row">
              <input type="checkbox" {...form.register('isActive')} />
              Активно
            </label>
            <button className="primary-button" disabled={saveMutation.isPending} type="submit">
              {editing ? 'Сохранить' : 'Создать'}
            </button>
            {editing ? (
              <button
                className="secondary-button"
                onClick={() => {
                  setEditing(null)
                  form.reset(emptyValues)
                }}
                type="button"
              >
                Отмена
              </button>
            ) : null}
          </form>
        </div>
      </section>

      <section className="panel">
        <h2>Import / Export JSON</h2>
        <textarea
          className="json-textarea"
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Вставьте JSON-массив веществ или нажмите Export JSON"
          rows={10}
          value={importText}
        />
        <button className="primary-button" disabled={!importText || importMutation.isPending} onClick={handleImport} type="button">
          Import JSON
        </button>
      </section>
    </div>
  )
}

function formValuesToPayload(values: SubstanceFormValues): SubstancePayload {
  return {
    code: values.code,
    name: values.name,
    aliases: splitComma(values.aliasesText),
    category: values.category,
    dangerLevel: values.dangerLevel,
    description: values.description,
    sources: splitLines(values.sourcesText),
    isActive: values.isActive,
  }
}

function substanceToPayload(item: Substance): SubstancePayload {
  return {
    code: item.code ?? '',
    name: item.name,
    aliases: item.aliases,
    category: item.category,
    dangerLevel: item.dangerLevel,
    description: item.description,
    sources: item.sources,
    isActive: item.isActive,
  }
}

function splitComma(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}
