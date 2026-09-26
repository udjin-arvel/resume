import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@shared'
import { store, AuthProvider, ReferenceFilesProvider } from '@app'
import { Provider } from 'react-redux'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Provider store={store}>
        <ThemeProvider>
          <ReferenceFilesProvider>
            <App />
          </ReferenceFilesProvider>
        </ThemeProvider>
      </Provider>
    </AuthProvider>
  </StrictMode>
)
