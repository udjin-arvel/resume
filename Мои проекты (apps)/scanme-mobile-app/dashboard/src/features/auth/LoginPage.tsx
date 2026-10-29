import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { loginAdmin } from './api'
import { setAdminToken } from './session'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@scanme.local',
      password: '',
    },
  })
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (data) => {
      setAdminToken(data.accessToken)
      void navigate({ to: '/substances' })
    },
  })

  const onSubmit = form.handleSubmit((values) => loginMutation.mutate(values))

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div>
          <span className="eyebrow">ScanMe Admin</span>
          <h1>Вход в админку</h1>
          <p>Используется отдельный admin-JWT. Пользовательские токены приложения сюда не подходят.</p>
        </div>

        <label>
          Email
          <input autoComplete="email" type="email" {...form.register('email')} />
          {form.formState.errors.email ? <span className="field-error">{form.formState.errors.email.message}</span> : null}
        </label>

        <label>
          Пароль
          <input autoComplete="current-password" type="password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <span className="field-error">{form.formState.errors.password.message}</span>
          ) : null}
        </label>

        {loginMutation.isError ? (
          <div className="form-error">Не удалось войти. Проверьте email, пароль и доступность API.</div>
        ) : null}

        <button className="primary-button" disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
