import { Outlet, createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { getHealth } from './api/health'
import { AppShell } from './components/shared/AppShell'
import { AnalyticsOverviewPage } from './features/analytics/AnalyticsOverviewPage'
import { AuditLogPage } from './features/audit/AuditLogPage'
import { LoginPage } from './features/auth/LoginPage'
import { isAdminAuthenticated } from './features/auth/session'
import { ProductsPage } from './features/products/ProductsPage'
import { SubstancesPage } from './features/substances/SubstancesPage'
import { ModerationQueuePage } from './features/moderation/ModerationQueuePage'
import { UsersListPage } from './features/users/UsersListPage'

function ProtectedLayout() {
  const healthQuery = useQuery({
    queryKey: ['healthz'],
    queryFn: getHealth,
  })

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <span className="eyebrow">Этап 9</span>
          <h1>ScanMe Admin</h1>
          <p>Аналитика, пользователи и журнал аудита подключены к API.</p>
        </div>

        <div className={healthQuery.isError ? 'status status-error' : 'status status-ok'}>
          API: {healthQuery.isLoading ? 'проверка...' : healthQuery.isError ? 'недоступен' : healthQuery.data?.status}
        </div>
      </div>

      <Outlet />
    </AppShell>
  )
}

const rootRoute = createRootRoute({
  component: Outlet,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/substances' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: () => {
    if (!isAdminAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProtectedLayout,
})

const substancesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/substances',
  component: SubstancesPage,
})

const productsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/products',
  component: ProductsPage,
})

const moderationRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/moderation',
  component: ModerationQueuePage,
})

const usersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users',
  component: UsersListPage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: AnalyticsOverviewPage,
})

const auditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/audit',
  component: AuditLogPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedRoute.addChildren([
    substancesRoute,
    productsRoute,
    moderationRoute,
    usersRoute,
    analyticsRoute,
    auditRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
