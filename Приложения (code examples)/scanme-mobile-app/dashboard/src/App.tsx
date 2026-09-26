import { RouterProvider } from '@tanstack/react-router'

import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { router } from './router'

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
