import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { formatApiError } from '../../api/client'
import {
  createProduct,
  deleteProduct,
  listAdminProducts,
  type Product,
  type ProductFilters,
  type ProductPayload,
  updateProduct,
} from './api'

const schema = z.object({
  barcode: z.string().trim().min(3, 'Штрих-код обязателен'),
  name: z.string().trim().min(2, 'Название обязательно'),
  brands: z.string(),
  imageUrl: z.string(),
  ingredientsText: z.string(),
})

type ProductFormValues = z.infer<typeof schema>

const emptyValues: ProductFormValues = {
  barcode: '',
  name: '',
  brands: '',
  imageUrl: '',
  ingredientsText: '',
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<ProductFilters>({})
  const [editing, setEditing] = useState<Product | null>(null)
  const [message, setMessage] = useState('')

  const productsQuery = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => listAdminProducts(filters),
  })

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = formValuesToPayload(values)
      return editing ? updateProduct(editing.barcode, payload) : createProduct(payload)
    },
    onSuccess: () => {
      setMessage(editing ? 'Товар обновлён' : 'Товар создан')
      setEditing(null)
      form.reset(emptyValues)
      void invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      setMessage('Товар удалён')
      void invalidate()
    },
  })

  const items = productsQuery.data?.items ?? []

  function handleEdit(item: Product) {
    setEditing(item)
    form.reset({
      barcode: item.barcode,
      name: item.name,
      brands: item.brands ?? '',
      imageUrl: item.imageUrl ?? '',
      ingredientsText: ingredientsToText(item.ingredients),
    })
  }

  return (
    <div className="substances-page">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Товары</h2>
            <p>CRUD для кэша и ручного наполнения базы продуктов ScanMe.</p>
          </div>
        </div>

        <div className="filters">
          <input
            aria-label="Поиск товаров"
            onChange={(event) => setFilters({ q: event.target.value })}
            placeholder="Поиск по штрих-коду, названию или бренду"
          />
        </div>

        {message ? <div className="status status-ok">{message}</div> : null}
        {productsQuery.isError ? (
          <div className="form-error">
            Не удалось загрузить товары: {formatApiError(productsQuery.error)}. Проверьте, что API запущен (
            {import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}
            ), вы вошли под admin-JWT и на сервере развёрнута версия с{' '}
            <code>/v1/admin/products</code>.
          </div>
        ) : null}
        {saveMutation.isError ? (
          <div className="form-error">Сохранение: {formatApiError(saveMutation.error)}</div>
        ) : null}
        {deleteMutation.isError ? (
          <div className="form-error">Удаление: {formatApiError(deleteMutation.error)}</div>
        ) : null}

        <div className="substances-grid">
          <div className="substance-list">
            {productsQuery.isLoading ? <p>Загрузка...</p> : null}
            {items.map((item) => (
              <article className="substance-card" key={item.barcode}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.brands || 'без бренда'} · {item.barcode}
                  </span>
                </div>
                {item.imageUrl ? <img alt="" className="product-thumb" src={item.imageUrl} /> : null}
                <p>
                  Ингредиентов: {item.ingredients.length} · Истекает:{' '}
                  {new Date(item.cachedUntil).toLocaleDateString('ru-RU')}
                </p>
                <div className="card-actions">
                  <button className="secondary-button" onClick={() => handleEdit(item)} type="button">
                    Изменить
                  </button>
                  <button className="danger-button" onClick={() => deleteMutation.mutate(item.barcode)} type="button">
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <form className="substance-form" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <h3>{editing ? 'Редактировать товар' : 'Новый товар'}</h3>
            <label>
              Штрих-код
              <input readOnly={Boolean(editing)} {...form.register('barcode')} />
              {form.formState.errors.barcode ? (
                <span className="field-error">{form.formState.errors.barcode.message}</span>
              ) : null}
            </label>
            <label>
              Название
              <input {...form.register('name')} />
              {form.formState.errors.name ? <span className="field-error">{form.formState.errors.name.message}</span> : null}
            </label>
            <input placeholder="Бренд" {...form.register('brands')} />
            <input placeholder="URL изображения" {...form.register('imageUrl')} />
            <textarea
              placeholder="Ингредиенты, по одному на строку. Можно указывать проценты через |, например: Sugar | 12%"
              rows={8}
              {...form.register('ingredientsText')}
            />
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
    </div>
  )
}

function formValuesToPayload(values: ProductFormValues): ProductPayload {
  return {
    barcode: values.barcode,
    name: values.name,
    brands: values.brands,
    imageUrl: values.imageUrl,
    ingredients: splitIngredients(values.ingredientsText),
  }
}

function splitIngredients(value: string) {
  return value
    .split('\n')
    .map((line, index) => {
      const [text, percent = ''] = line.split('|').map((part) => part.trim())
      return { text, percent, rank: index + 1 }
    })
    .filter((item) => item.text)
}

function ingredientsToText(items: Product['ingredients']) {
  return items
    .map((item) => (item.percent ? `${item.text} | ${item.percent}` : item.text))
    .join('\n')
}
